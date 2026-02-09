import { signal, computed, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/** Type alias for the rxResource return type */
type RxResourceRef<T> = ReturnType<typeof rxResource<T, unknown>>;

/** Standard page response shape returned from fetch function */
export interface PageResponse<TRow> {
  rows: TRow[];
  total: number;
  hasMore: boolean;
}

/** Configuration for createPaginatedResource */
export interface PaginatedResourceConfig<TRow, TParams> {
  /**
   * Function returning fetch params. Return null/undefined if not ready to fetch.
   * Changes to params (as serialized by paramsKey) will reset pagination to page 0.
   */
  params: () => TParams | null | undefined;

  /**
   * Fetch function receiving params and page number.
   * Should return an Observable of PageResponse.
   */
  fetch: (params: TParams, page: number) => Observable<PageResponse<TRow>>;

  /**
   * Creates a key from params for change detection.
   * When the key changes, pagination resets to page 0.
   * Default: JSON.stringify
   */
  paramsKey?: (params: TParams) => string;

  /**
   * Called when page 0 loads successfully or errors.
   * Useful for initialLoadTracker integration.
   */
  onFirstPageLoaded?: () => void;

  /**
   * Error handler called on fetch errors.
   * Default: console.error
   */
  onError?: (error: unknown, page: number) => void;
}

/** Return type of createPaginatedResource */
export interface PaginatedResource<TRow> {
  /** Accumulated rows across all pages */
  rows: Signal<TRow[]>;

  /** Total count from last successful response */
  total: Signal<number>;

  /** Whether more data is available (false if errored) */
  hasMore: Signal<boolean>;

  /** Whether currently loading a subsequent page (page > 0) */
  isLoadingMore: Signal<boolean>;

  /** Whether currently loading the first page (page === 0) */
  isLoading: Signal<boolean>;

  /** Whether an error has occurred (prevents further pagination) */
  hasError: Signal<boolean>;

  /** Load the next page. No-op if already loading, errored, or no more data. */
  loadMore: () => void;

  /** Reset state and reload from page 0. */
  refresh: () => void;

  /** The underlying rxResource (for advanced use cases) */
  resource: RxResourceRef<PageResponse<TRow> | null>;

  /** Current page number (0-indexed) */
  page: Signal<number>;
}

/**
 * Creates a paginated resource that manages infinite scroll state.
 *
 * This utility encapsulates the common pattern of:
 * - Managing page state
 * - Accumulating rows across pages
 * - Detecting param changes to reset pagination
 * - Preventing further pagination on error
 * - Caching total count to prevent flicker
 *
 * @example
 * ```typescript
 * private pagination = createPaginatedResource<MyRow, MyParams>({
 *   params: () => {
 *     if (!this.isReady()) return null;
 *     return { filters: this.filters(), sort: this.sort() };
 *   },
 *   fetch: (params, page) =>
 *     this.service.fetchPage(page, params.filters, params.sort).pipe(
 *       map(r => ({ rows: r.data, total: r.total, hasMore: r.hasMore }))
 *     ),
 *   onFirstPageLoaded: () => this.initialLoad.markLoaded('details'),
 *   onError: (err) => this.handleError('Failed to load', err),
 * });
 *
 * // Use in template via signals
 * protected rows = this.pagination.rows;
 * protected total = this.pagination.total;
 * protected hasMore = this.pagination.hasMore;
 * protected loadingMore = this.pagination.isLoadingMore;
 * protected loadMore = this.pagination.loadMore;
 * ```
 */
export function createPaginatedResource<TRow, TParams>(
  config: PaginatedResourceConfig<TRow, TParams>,
): PaginatedResource<TRow> {
  const page = signal(0);
  const rows = signal<TRow[]>([]);
  const total = signal(0);
  const hasError = signal(false);
  let prevParamsKey = '';

  const getParamsKey = config.paramsKey ?? ((p: TParams) => JSON.stringify(p));
  const onError = config.onError ?? ((err: unknown) => console.error(err));

  const resource = rxResource({
    params: () => {
      const params = config.params();
      if (params == null) return null;
      return { params, page: page() };
    },
    stream: ({ params: wrapper }) => {
      if (!wrapper) return of(null);

      const { params, page: currentPage } = wrapper;
      const paramsKey = getParamsKey(params);

      // Reset to page 0 if params changed
      if (paramsKey !== prevParamsKey) {
        prevParamsKey = paramsKey;
        hasError.set(false);
        if (currentPage !== 0) {
          page.set(0);
          return of(null);
        }
      }

      return config.fetch(params, currentPage).pipe(
        tap((response) => {
          total.set(response.total);
          if (currentPage === 0) {
            rows.set(response.rows);
            config.onFirstPageLoaded?.();
          } else {
            rows.update((existing) => [...existing, ...response.rows]);
          }
        }),
        catchError((error) => {
          onError(error, currentPage);
          hasError.set(true);
          if (currentPage === 0) {
            rows.set([]);
            total.set(0);
            config.onFirstPageLoaded?.();
          }
          return of({ rows: [], total: 0, hasMore: false });
        }),
      );
    },
  });

  const hasMoreComputed = computed(() => !hasError() && resource.value()?.hasMore === true);

  return {
    rows: rows.asReadonly(),
    total: total.asReadonly(),
    hasMore: hasMoreComputed,
    isLoadingMore: computed(() => page() > 0 && resource.isLoading()),
    isLoading: computed(() => page() === 0 && resource.isLoading()),
    hasError: hasError.asReadonly(),
    loadMore: () => {
      if (hasMoreComputed() && !resource.isLoading()) {
        page.update((p) => p + 1);
      }
    },
    refresh: () => {
      hasError.set(false);
      page.set(0);
      rows.set([]);
      prevParamsKey = '';
      resource.reload();
    },
    resource,
    page: page.asReadonly(),
  };
}
