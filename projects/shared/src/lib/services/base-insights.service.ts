import { inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CachedHttpRequest } from '../utils/cached-http-request';
import { downloadBlob } from '../utils/file-download.util';
import { Context } from '../models/server-context.interface';
import { Sort } from '../components/table/rich-table';

/** Column definition for CSV export with ID and display name for header. */
export interface CsvColumn {
  id: string;
  displayName: string;
}

/** Sort field with column name and direction. */
export interface SortField {
  field: string;
  direction: 'asc' | 'desc';
}

/** Page size for all data requests (initial load and infinite scroll) */
const PAGE_SIZE = 25;

/**
 * Base service for insights functionality providing common patterns:
 * - Context management with cache clearing
 * - Distinct values caching per field
 * - CSV download with blob streaming
 *
 * Subclasses should implement domain-specific methods and provide
 * the base URL for distinct values via `getDistinctValuesUrl()`.
 */
export abstract class BaseInsightsService {
  protected http = inject(HttpClient);

  /** Current context for scoped queries (null = global) */
  protected context: Context | null = null;

  /** Page size for paginated requests */
  readonly pageSize = PAGE_SIZE;

  /** Cache of distinct value requests by field name */
  private distinctValuesCache = new Map<string, CachedHttpRequest<string[]>>();

  /** CSV download in progress state */
  readonly downloadingCsv = signal<boolean>(false);

  // ============================================
  // Context Management
  // ============================================

  /**
   * Set the context for all subsequent requests.
   * Clears distinct values cache if context changed.
   */
  setContext(context: Context | null): void {
    const changed = JSON.stringify(this.context) !== JSON.stringify(context);
    this.context = context;
    if (changed) {
      this.distinctValuesCache.clear();
      this.onContextChanged();
    }
  }

  /**
   * Get the current context. Returns null if not set.
   * Use `requireContext()` if you need to throw on missing context.
   */
  getContext(): Context | null {
    return this.context;
  }

  /**
   * Get the current context, throwing if not set.
   * Use this when context is required for an operation.
   */
  protected requireContext(): Context {
    if (!this.context) {
      throw new Error('Context not set. Call setContext() first.');
    }
    return this.context;
  }

  /**
   * Hook called when context changes. Override to clear additional caches.
   */
  protected onContextChanged(): void {
    // Subclasses can override to clear additional caches
  }

  // ============================================
  // Distinct Values
  // ============================================

  /**
   * Get distinct values for a field (used for filter options).
   * Results are cached per field.
   */
  getDistinctValues(field: string): Observable<string[]> {
    let cached = this.distinctValuesCache.get(field);
    if (!cached) {
      cached = new CachedHttpRequest<string[]>(
        this.http,
        'POST',
        this.getDistinctValuesUrl(field),
        { body: () => this.getDistinctValuesBody() },
      );
      this.distinctValuesCache.set(field, cached);
    }
    return cached.get();
  }

  /**
   * Get the URL for fetching distinct values for a field.
   * Subclasses must implement this with their domain-specific URL.
   */
  protected abstract getDistinctValuesUrl(field: string): string;

  /**
   * Get the request body for fetching distinct values.
   * Default implementation includes context if set.
   */
  protected getDistinctValuesBody(): Record<string, unknown> {
    return this.context ? { context: this.context } : {};
  }

  // ============================================
  // CSV Download
  // ============================================

  /**
   * Download data as CSV using blob streaming.
   *
   * @param url - API endpoint URL
   * @param requestBody - Request body to POST
   * @param filename - Output filename for the downloaded file
   */
  protected async downloadCsvBlob(
    url: string,
    requestBody: Record<string, unknown>,
    filename: string,
  ): Promise<void> {
    this.downloadingCsv.set(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: BlobPart[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new Uint8Array(value));
      }

      const blob = new Blob(chunks, { type: 'text/csv' });
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      throw err;
    } finally {
      this.downloadingCsv.set(false);
    }
  }

  /**
   * Build sort parameter for CSV/detail requests.
   */
  protected buildSortParam(sort: Sort): SortField[] | undefined {
    if (!sort.column) return undefined;
    return [{ field: sort.column, direction: sort.direction }];
  }

  /**
   * Build context object for request body.
   * Returns context if set, otherwise empty object spread.
   */
  protected buildContextBody(): { context: Context } | Record<string, never> {
    return this.context ? { context: this.context } : {};
  }
}
