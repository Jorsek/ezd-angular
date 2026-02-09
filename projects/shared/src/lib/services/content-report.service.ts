import { inject, Injectable } from '@angular/core';
import { Sort } from '../components/table/rich-table';
import { map, Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { ViewFilter } from '../components/insights-views';
import { BaseInsightsService, CsvColumn } from './base-insights.service';
import { ContentInsightsControllerService } from '@ccms/api/api/content-insights-controller.service';
import {
  InsightsSummaryRequest,
  FilterEntry,
  Context as ApiContext,
  SummarySpec as ApiSummarySpec,
} from '@ccms/api/model/models';

export interface ContentInsightDetail {
  resourceId: number;
  resourceUuid: string;
  fileName: string;
  title?: string;
  mimeType?: string;
  directoryPath?: string;
  folderName: string;
  fileStatus?: string;
  owner: string;
  wordCount?: number;
  charCount?: number;
  contentType?: string;
  createdUtc: string;
  lastModifiedUtc: string;
  locales: unknown; // JsonNode
  /** Index signature for dynamic metadata/computed fields */
  [key: string]: unknown;
}

export interface SummaryResult {
  name: string;
  value: number;
}
/** Stacked summary result for grouped/stacked charts */
export interface StackedSummaryResult {
  category: string;
  stack: string;
  value: number;
}
export type CalloutTypes =
  | 'TOTAL_WORDS'
  | 'TOTAL_OBJECTS'
  | 'CONTENT_TYPES'
  | 'LOCALES'
  | 'TOTAL_FOLDERS';
export type SummaryType = 'WORDS' | 'OBJECTS';
export interface SummarySpec {
  type: SummaryType;
  field: string;
  stackBy?: string;
  bucket?: string;
  includeFolderCount?: boolean;
  limit?: number;
}

export interface ContentInsightsSummaries {
  callouts: Record<string, number>;
  summaries: Record<string, SummaryResult[]>;
  /** Stacked summaries returned when stackBy is specified in the request */
  stackedSummaries?: Record<string, StackedSummaryResult[]>;
  /** Error message if the request failed */
  error?: string;
}

// Re-export CsvColumn from base for consumers
export type { CsvColumn } from './base-insights.service';

// Service is intentionally not providedIn: 'root' - it's meant to be provided
// at component level for hierarchical scoping (each parent gets its own instance)
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class ContentReportService extends BaseInsightsService {
  private api = inject(ContentInsightsControllerService);

  // Distinct values are now fetched directly via the generated API in the component.
  // This stub satisfies the abstract contract from BaseInsightsService.
  protected getDistinctValuesUrl(_field: string): string {
    return '';
  }

  // ============================================
  // Summary Methods
  // ============================================

  public getSummary(): Observable<ContentInsightsSummaries> {
    const callouts: CalloutTypes[] = ['TOTAL_WORDS', 'TOTAL_OBJECTS'];
    const summaries: Record<string, SummarySpec> = {
      content_type: {
        type: 'OBJECTS',
        field: 'contentType',
        includeFolderCount: true,
        limit: 10,
      },
    };

    return this.getSummaries([], summaries, callouts);
  }

  public getSummaries(
    filters: ViewFilter[],
    summaries: Record<string, SummarySpec> = {},
    callouts: CalloutTypes[] = [],
  ): Observable<ContentInsightsSummaries> {
    const request: InsightsSummaryRequest = {
      context: this.requireContext() as ApiContext,
      filters: filters as unknown as FilterEntry[],
      callouts,
      summaries: summaries as unknown as Record<string, ApiSummarySpec>,
    };

    return this.api.getSummary2(request).pipe(
      map((res) => res as unknown as ContentInsightsSummaries),
      retry(3),
      catchError((error) => {
        console.error('Failed to fetch content summary after retries:', error);
        return of({
          callouts: {},
          summaries: {},
          error: 'Failed to load summary data. Please try again.',
        } as ContentInsightsSummaries);
      }),
    );
  }

  // ============================================
  // Details Methods
  // ============================================

  public fetchContentInsightsDetails(
    page: number,
    filters: ViewFilter[],
    sort: Sort,
  ): Observable<{ data: ContentInsightDetail[]; total: number }> {
    const sortParams = sort.column ? [`${sort.column},${sort.direction.toUpperCase()}`] : undefined;

    return this.api
      .getDetail1(page, this.pageSize, sortParams, {
        context: this.requireContext() as ApiContext,
        filters: filters as unknown as FilterEntry[],
      })
      .pipe(
        retry(3),
        map((res) => ({
          data: (res.content ?? []) as unknown as ContentInsightDetail[],
          total: res.page?.totalElements ?? 0,
        })),
      );
  }

  // ============================================
  // CSV Export
  // ============================================

  async downloadCsv(filters: ViewFilter[], columns: CsvColumn[], sort?: Sort): Promise<void> {
    // CSV export uses streaming blob download, not the generated API client
    const requestBody = {
      context: this.requireContext(),
      filters,
      columns,
      ...(sort?.column && {
        sort: this.buildSortParam(sort),
      }),
    };

    await this.downloadCsvBlob(
      '/ezdnxtgen/api/turbo/proxy/insights/content/export/csv',
      requestBody as unknown as Record<string, unknown>,
      'content-insights.csv',
    );
  }
}
