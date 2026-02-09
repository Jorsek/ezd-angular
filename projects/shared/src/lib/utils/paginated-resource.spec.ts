import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, delay, throwError } from 'rxjs';
import { createPaginatedResource, PageResponse } from './paginated-resource';

interface TestRow {
  id: number;
  name: string;
}

interface TestParams {
  filter: string;
  sort: string;
}

function createTestPageResponse(
  rows: TestRow[],
  total: number,
  hasMore: boolean,
): PageResponse<TestRow> {
  return { rows, total, hasMore };
}

describe('createPaginatedResource', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset TestBed for each test to ensure clean signal state
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty state', () => {
    TestBed.runInInjectionContext(() => {
      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => null,
        fetch: () => of(createTestPageResponse([], 0, false)),
      });

      expect(pagination.rows()).toEqual([]);
      expect(pagination.total()).toBe(0);
      expect(pagination.hasError()).toBe(false);
      expect(pagination.page()).toBe(0);
    });
  });

  it('should not fetch when params returns null', async () => {
    await TestBed.runInInjectionContext(async () => {
      const fetchFn = vi.fn(() => of(createTestPageResponse([], 0, false)));

      createPaginatedResource<TestRow, TestParams>({
        params: () => null,
        fetch: fetchFn,
      });

      // Give rxResource time to potentially trigger
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  it('should fetch when params returns valid value', async () => {
    await TestBed.runInInjectionContext(async () => {
      const testRows = [{ id: 1, name: 'Item 1' }];
      const fetchFn = vi.fn(() => of(createTestPageResponse(testRows, 100, true)));

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      // Wait for rxResource to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchFn).toHaveBeenCalledWith({ filter: 'test', sort: 'name' }, 0);
      expect(pagination.rows()).toEqual(testRows);
      expect(pagination.total()).toBe(100);
      expect(pagination.hasMore()).toBe(true);
    });
  });

  it('should accumulate rows when loading more pages', async () => {
    await TestBed.runInInjectionContext(async () => {
      const page1Rows = [{ id: 1, name: 'Item 1' }];
      const page2Rows = [{ id: 2, name: 'Item 2' }];

      const fetchFn = vi.fn((_params: TestParams, page: number) => {
        if (page === 0) {
          return of(createTestPageResponse(page1Rows, 100, true));
        }
        return of(createTestPageResponse(page2Rows, 100, false));
      });

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      // Wait for first page
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.rows()).toEqual(page1Rows);
      expect(pagination.page()).toBe(0);

      // Load next page
      pagination.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(pagination.page()).toBe(1);
      expect(pagination.rows()).toEqual([...page1Rows, ...page2Rows]);
      expect(pagination.hasMore()).toBe(false);
    });
  });

  it('should not load more when hasMore is false', async () => {
    await TestBed.runInInjectionContext(async () => {
      const testRows = [{ id: 1, name: 'Item 1' }];
      const fetchFn = vi.fn(() => of(createTestPageResponse(testRows, 1, false)));

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      const initialCallCount = fetchFn.mock.calls.length;

      pagination.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have made another call
      expect(fetchFn.mock.calls.length).toBe(initialCallCount);
      expect(pagination.page()).toBe(0);
    });
  });

  it('should reset to page 0 when params change', async () => {
    await TestBed.runInInjectionContext(async () => {
      const params = signal<TestParams>({ filter: 'initial', sort: 'name' });
      const fetchFn = vi.fn((p: TestParams, page: number) =>
        of(createTestPageResponse([{ id: page + 1, name: p.filter }], 100, true)),
      );

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => params(),
        fetch: fetchFn,
      });

      // Wait for first page
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Load next page
      pagination.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.page()).toBe(1);

      // Change params
      params.set({ filter: 'changed', sort: 'name' });
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should reset to page 0
      expect(pagination.page()).toBe(0);
      expect(pagination.rows()).toEqual([{ id: 1, name: 'changed' }]);
    });
  });

  it('should handle errors and prevent further pagination', async () => {
    await TestBed.runInInjectionContext(async () => {
      const fetchFn = vi.fn(() => throwError(() => new Error('Network error')));

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(pagination.hasError()).toBe(true);
      expect(pagination.hasMore()).toBe(false);
      expect(pagination.rows()).toEqual([]);
      expect(pagination.total()).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('should call onError handler when error occurs', async () => {
    await TestBed.runInInjectionContext(async () => {
      const onError = vi.fn();
      const error = new Error('Test error');
      const fetchFn = vi.fn(() => throwError(() => error));

      createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
        onError,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(error, 0);
    });
  });

  it('should call onFirstPageLoaded when page 0 completes', async () => {
    await TestBed.runInInjectionContext(async () => {
      const onFirstPageLoaded = vi.fn();
      const fetchFn = vi.fn(() => of(createTestPageResponse([{ id: 1, name: 'Item' }], 1, false)));

      createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
        onFirstPageLoaded,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onFirstPageLoaded).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onFirstPageLoaded even on page 0 error', async () => {
    await TestBed.runInInjectionContext(async () => {
      const onFirstPageLoaded = vi.fn();
      const fetchFn = vi.fn(() => throwError(() => new Error('Error')));

      createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
        onFirstPageLoaded,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onFirstPageLoaded).toHaveBeenCalledTimes(1);
    });
  });

  it('should use custom paramsKey function for change detection', async () => {
    await TestBed.runInInjectionContext(async () => {
      const params = signal<TestParams>({ filter: 'test', sort: 'name' });
      const fetchFn = vi.fn(() => of(createTestPageResponse([{ id: 1, name: 'Item' }], 1, true)));

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => params(),
        fetch: fetchFn,
        // Only consider filter in change detection, ignore sort
        paramsKey: (p) => p.filter,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      pagination.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.page()).toBe(1);

      // Change sort - should NOT reset because paramsKey only uses filter
      params.set({ filter: 'test', sort: 'different' });
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(pagination.page()).toBe(1); // Still on page 1

      // Change filter - should reset
      params.set({ filter: 'changed', sort: 'different' });
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(pagination.page()).toBe(0);
    });
  });

  it('should refresh correctly', async () => {
    await TestBed.runInInjectionContext(async () => {
      let callCount = 0;
      const fetchFn = vi.fn(() => {
        callCount++;
        return of(
          createTestPageResponse([{ id: callCount, name: `Item ${callCount}` }], 100, true),
        );
      });

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.rows()[0].id).toBe(1);

      // Load more pages
      pagination.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.page()).toBe(1);

      // Refresh
      pagination.refresh();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(pagination.page()).toBe(0);
      expect(pagination.hasError()).toBe(false);
      expect(pagination.rows()[0].id).toBe(3); // Fresh fetch
    });
  });

  it('should clear error state on refresh', async () => {
    await TestBed.runInInjectionContext(async () => {
      let shouldError = true;
      const fetchFn = vi.fn(() => {
        if (shouldError) {
          return throwError(() => new Error('Error'));
        }
        return of(createTestPageResponse([{ id: 1, name: 'Item' }], 1, false));
      });

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.hasError()).toBe(true);

      // Fix the error and refresh
      shouldError = false;
      pagination.refresh();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(pagination.hasError()).toBe(false);
      expect(pagination.rows()).toEqual([{ id: 1, name: 'Item' }]);
    });
  });

  it('should report isLoading correctly for page 0', async () => {
    await TestBed.runInInjectionContext(async () => {
      const fetchFn = vi.fn(() =>
        of(createTestPageResponse([{ id: 1, name: 'Item' }], 1, false)).pipe(delay(50)),
      );

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      // Should be loading initially
      expect(pagination.isLoading()).toBe(true);
      expect(pagination.isLoadingMore()).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(pagination.isLoading()).toBe(false);
    });
  });

  it('should report isLoadingMore correctly for page > 0', async () => {
    await TestBed.runInInjectionContext(async () => {
      let callCount = 0;
      const fetchFn = vi.fn(() => {
        callCount++;
        const delayMs = callCount === 1 ? 10 : 100;
        return of(createTestPageResponse([{ id: callCount, name: 'Item' }], 100, true)).pipe(
          delay(delayMs),
        );
      });

      const pagination = createPaginatedResource<TestRow, TestParams>({
        params: () => ({ filter: 'test', sort: 'name' }),
        fetch: fetchFn,
      });

      // Wait for first page
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Load more
      pagination.loadMore();

      // Should show loading more
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(pagination.isLoadingMore()).toBe(true);
      expect(pagination.isLoading()).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(pagination.isLoadingMore()).toBe(false);
    });
  });
});
