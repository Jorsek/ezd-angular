import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';
import { CachedHttpRequest } from '../../utils/cached-http-request';
import {
  LocaleDetailResponse,
  LocalizationDetailRow,
} from '../../models/locale-detail-response.interface';
import { LocaleSummaryResponse } from '../../models/locale-summary-response.interface';
import {
  Locale,
  LocalizationRootMapInfo,
  RefreshResponse,
  RefreshResult,
  LocalizationJob,
  RootMapsResponse,
  Sort,
} from '../../models/localization-insights.interface';
import { ViewFilter } from '../../components/insights-views';
import { BaseInsightsService, CsvColumn } from '../base-insights.service';

/** Summary specification for chart data */
export interface SummarySpec {
  type: string;
  field: string;
  stackBy?: string;
  bucket?: string;
}

/** Request body format for API calls */
interface InsightsRequest {
  filters: ViewFilter[];
  context?: unknown;
  summaries?: Record<string, SummarySpec>;
  callouts?: string[];
}

/** Timeout for insights refresh API call in milliseconds (60 seconds) */
const REFRESH_TIMEOUT_MS = 60000;

/** Result type for summary data - either data or error */
export type SummaryDataResult =
  | { data: LocaleSummaryResponse; error?: undefined }
  | { data?: undefined; error: string };

/** Result type for a single page of details */
export interface DetailsPage {
  rows: LocalizationDetailRow[];
  hasMore: boolean;
  totalCount: number;
}

// Re-export CsvColumn from base for consumers
export type { CsvColumn } from '../base-insights.service';

/**
 * Service for localization insights functionality.
 * Methods take filters/sort as parameters for explicit data flow.
 */
// Service is intentionally not providedIn: 'root' - it's meant to be provided
// at component level for hierarchical scoping (each parent gets its own instance)
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class LocalizationInsightsService extends BaseInsightsService {
  // ============================================
  // Cached Filter Data APIs
  // ============================================

  private localesRequest = new CachedHttpRequest<Locale[]>(
    this.http,
    'POST',
    '/ezdnxtgen/api/turbo/proxy/insights/localization/active-locales',
    { body: () => this.buildContextBody() },
  );

  private rootMapsRequest = new CachedHttpRequest<RootMapsResponse>(
    this.http,
    'GET',
    '/ezdnxtgen/api/turbo/proxy/insights/localization/root-maps?size=10000',
  );

  private jobsRequest = new CachedHttpRequest<LocalizationJob[]>(
    this.http,
    'GET',
    '/ezdnxtgen/api/turbo/proxy/insights/localization/jobs',
  );

  // ============================================
  // Abstract Method Implementations
  // ============================================

  protected getDistinctValuesUrl(field: string): string {
    return `/ezdnxtgen/api/turbo/proxy/insights/localization/distinct-values?field=${field}`;
  }

  // ============================================
  // Cached Filter Data Methods
  // ============================================

  /**
   * Fetch active locales from the API.
   * Cached - call refreshFilterData() to refresh.
   * Returns empty array on error.
   */
  getActiveLocales(): Observable<Locale[]> {
    return this.localesRequest.get().pipe(
      catchError((err) => {
        console.warn('Failed to load active locales:', err);
        return of([]);
      }),
    );
  }

  /**
   * Fetch root maps from the API.
   * Cached - call refreshFilterData() to refresh.
   */
  getRootMaps(): Observable<LocalizationRootMapInfo[]> {
    return this.rootMapsRequest.get().pipe(map((response) => response.content));
  }

  /**
   * Fetch localization jobs from the API.
   * Cached - call refreshFilterData() to refresh.
   */
  getJobs(): Observable<LocalizationJob[]> {
    return this.jobsRequest.get();
  }

  /**
   * Refresh all cached filter data (locales, root maps, jobs).
   */
  refreshFilterData(): void {
    this.localesRequest.refresh();
    this.rootMapsRequest.refresh();
    this.jobsRequest.refresh();
  }

  // ============================================
  // Data Fetch Methods (take filters as params)
  // ============================================

  /**
   * Refresh insights data before loading the page.
   * Calls the refresh endpoint with a 60-second timeout.
   */
  refreshInsightsData(): Observable<RefreshResult> {
    const refreshUrl = '/ezdnxtgen/api/turbo/proxy/insights/localization/refresh';

    return this.http.get<RefreshResponse>(refreshUrl).pipe(
      timeout(REFRESH_TIMEOUT_MS),
      map((response) => ({
        success: true,
        timestamp: response.timestamp,
        count: response.count,
      })),
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          console.warn(
            'Refresh insights data timed out after 60 seconds. Continuing with potentially stale data.',
          );
        } else {
          console.warn(
            'Failed to refresh insights data. Continuing with potentially stale data.',
            error,
          );
        }
        return of({ success: false });
      }),
    );
  }

  /**
   * Fetch summary data with filters, chart summaries, and callouts.
   * @param filters - ViewFilter[] passed directly to backend
   * @param summaries - Chart specifications for aggregation
   * @param callouts - Callout IDs to include in response
   * @returns Observable<SummaryDataResult> with data or error
   */
  getSummary(
    filters: ViewFilter[],
    summaries: Record<string, SummarySpec>,
    callouts: string[],
  ): Observable<SummaryDataResult> {
    return this.fetchSummary(filters, summaries, callouts).pipe(
      map((response) => ({ data: response }) as SummaryDataResult),
      retry(3),
      catchError((error) => {
        console.error('Failed to fetch summary data after retries:', error);
        return of({
          error: 'Failed to load summary data. Please try again.',
        } as SummaryDataResult);
      }),
    );
  }

  /**
   * Fetch a single page of details.
   * @param filters - ViewFilter[] passed directly to backend
   * @param sort - Sort state
   * @param page - Zero-based page number
   * @returns Observable<DetailsPage> with rows and pagination info
   */
  details(filters: ViewFilter[], sort: Sort, page: number): Observable<DetailsPage> {
    const sortParam = sort.column ? `&sort=${sort.column},${sort.direction.toUpperCase()}` : '';
    const url = `/ezdnxtgen/api/turbo/proxy/insights/localization/detail?page=${page}&size=${this.pageSize}${sortParam}`;
    const body: InsightsRequest = {
      filters,
      ...this.buildContextBody(),
    };

    return this.http.post<LocaleDetailResponse>(url, body).pipe(
      retry(3),
      map((response) => ({
        rows: response.content,
        hasMore: page + 1 < response.page.totalPages,
        totalCount: response.page.totalElements,
      })),
    );
  }

  /**
   * Download CSV with filters and sort.
   * @param filters - ViewFilter[] passed directly to backend
   * @param columns - Columns to include in CSV
   * @param sort - Sort state
   */
  async downloadCsv(filters: ViewFilter[], columns: CsvColumn[], sort: Sort): Promise<void> {
    if (!columns.length) {
      throw new Error('At least one column is required for CSV download');
    }

    const requestBody = {
      filters,
      columns,
      ...this.buildContextBody(),
      ...(sort.column && {
        sort: this.buildSortParam(sort),
      }),
    };

    await this.downloadCsvBlob(
      '/ezdnxtgen/api/turbo/proxy/insights/localization/export/csv',
      requestBody,
      'localization-insights.csv',
    );
  }

  // ============================================
  // Private Methods
  // ============================================

  /** Fetch summary data from API */
  private fetchSummary(
    filters: ViewFilter[],
    summaries: Record<string, SummarySpec>,
    callouts: string[],
  ): Observable<LocaleSummaryResponse> {
    const url = `/ezdnxtgen/api/turbo/proxy/insights/localization/summary`;
    const requestBody: InsightsRequest = {
      filters,
      summaries,
      callouts,
      ...this.buildContextBody(),
    };

    return this.http.post<LocaleSummaryResponse>(url, requestBody);
  }
}
