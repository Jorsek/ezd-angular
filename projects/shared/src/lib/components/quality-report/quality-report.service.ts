import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable } from 'rxjs';
import { shareReplay, switchMap, retry, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { CurrentViewService, InsightsViewSort, ViewFilter } from '../../components/insights-views';

export interface QualityReportFilter {
  type: string[];
  severity: string[];
}

interface QualityIssuesResponse {
  content: QualityIssue[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface QualityIssue {
  qualityCheck: {
    qualityCheckCode: string;
    qualityCheckName: string;
    qualityCheckDescription: string;
    severity: string;
    category: string;
  };
  issueUuid: string;
  message: string;
  severityCode: string;
  resourceInfo: {
    resourceUuid: string;
    filename: string;
    mimeType: string;
  };
  location: {
    type: string;
    location: string;
  };
  encodedLocation: string;
  encodedMessage: string;
}

export interface QualityReportCountsResponse {
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface QualityReportSummary {
  scanTimestamp: string;
  issuesByCategory: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  topicsWithCritical: number;
  topicsWithError: number;
  topicsWithWarning: number;
  topicsWithInfo: number;
}

/** Result type for a single page of quality issues */
export interface QualityIssuesPage {
  data: QualityIssue[];
  total: number;
  hasMore: boolean;
}

// Service is intentionally not providedIn: 'root' - it's meant to be provided
// at component level for hierarchical scoping (each parent gets its own instance)
// is this to match the behavior of CurrentViewService
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class QualityReportService {
  private http = inject(HttpClient);
  private currentViewService = inject(CurrentViewService);

  private contextResourceId$ = new BehaviorSubject('');
  private messageSearch$ = new BehaviorSubject<string>('');
  private fileNameSearch$ = new BehaviorSubject<string>('');

  readonly pageSize = 25;

  readonly filter = this.currentViewService.filters;
  readonly sort = this.currentViewService.sorts;

  /** Current context resource ID as a signal for rxResource */
  readonly contextResourceId = signal('');

  readonly counts$ = combineLatest([this.contextResourceId$, toObservable(this.filter)]).pipe(
    filter(([id]) => id.length > 0),
    switchMap(([id, viewFilters]) => {
      const filters = viewFiltersToQualityFilter(viewFilters);
      const categoryParam = filters.type.length > 0 ? `?categories=${filters.type.join(',')}` : '';
      const severityParam =
        filters.severity.length > 0
          ? `${categoryParam ? '&' : '?'}severity=${filters.severity.join(',')}`
          : '';
      return this.http.get<QualityReportCountsResponse>(
        `/ezdnxtgen/api/files/${id}/quality/counts${categoryParam}${severityParam}`,
      );
    }),
    retry(3),
    catchError((error) => {
      console.error('Failed to fetch quality counts:', error);
      return [];
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly summaries$ = this.contextResourceId$.pipe(
    filter((id) => id.length > 0),
    switchMap((id) =>
      this.http.get<QualityReportSummary[]>(`/ezdnxtgen/api/files/${id}/quality/scan-summaries`),
    ),
    retry(3),
    catchError((error) => {
      console.error('Failed to fetch quality summaries:', error);
      return [];
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Fetch a single page of quality issues.
   * @param page - Zero-based page number
   * @param filters - View filters to apply
   * @param sort - Sort configuration
   * @returns Observable<QualityIssuesPage> with data, total, and hasMore
   */
  fetchPage(
    page: number,
    filters: ViewFilter[],
    sort: InsightsViewSort | undefined,
  ): Observable<QualityIssuesPage> {
    const contextId = this.contextResourceId();
    if (!contextId) {
      return new Observable((subscriber) => {
        subscriber.next({ data: [], total: 0, hasMore: false });
        subscriber.complete();
      });
    }

    const qualityFilter = viewFiltersToQualityFilter(filters);
    const messageSearch = this.messageSearch$.value;
    const fileNameSearch = this.fileNameSearch$.value;

    let sortParam = '';
    if (sort) {
      const direction = sort.ascending ? 'ASC' : 'DESC';
      sortParam = sort.field ? `&sort=${sort.field},${direction}` : '';
    }

    const typeParam =
      qualityFilter.type.length > 0 ? `&categories=${qualityFilter.type.join(',')}` : '';
    const severityParam =
      qualityFilter.severity.length > 0 ? `&severity=${qualityFilter.severity.join(',')}` : '';
    const messageParam = messageSearch.length > 0 ? `&message-search=${messageSearch}` : '';
    const fileNameParam = fileNameSearch.length > 0 ? `&filename-search=${fileNameSearch}` : '';

    return this.http
      .get<QualityIssuesResponse>(
        `/ezdnxtgen/api/files/${contextId}/quality/issues?page-number=${page}&page-size=${this.pageSize}${sortParam}${typeParam}${severityParam}${messageParam}${fileNameParam}`,
      )
      .pipe(
        retry(3),
        map((res) => ({
          data: enhanceIssues(res.content),
          total: res.page.totalElements,
          hasMore: page + 1 < res.page.totalPages,
        })),
      );
  }

  setMessageSearch(search: string): void {
    this.messageSearch$.next(search);
  }

  setFileNameSearch(search: string): void {
    this.fileNameSearch$.next(search);
  }

  setContextResourceId(contextResourceId: string): void {
    this.contextResourceId$.next(contextResourceId);
    this.contextResourceId.set(contextResourceId);
  }

  refresh(): void {
    const currentId = this.contextResourceId$.value;
    if (currentId) {
      this.contextResourceId$.next(currentId);
    }
  }
}

function enhanceIssues(issues: QualityIssue[]): QualityIssue[] {
  for (const issue of issues) {
    const rawLocation = issue.location?.location || '';
    let encodedLocation = base64Encode(rawLocation);
    encodedLocation = encodedLocation.replace(/=+$/, ''); // Strip trailing '=' padding

    let encodedMessage = base64Encode(issue.message);
    encodedMessage = encodedMessage.replace(/=+$/, ''); // Strip trailing '=' padding

    issue.encodedLocation = encodedLocation;
    issue.encodedMessage = encodedMessage;
  }
  return issues;
}

function base64Encode(str: string): string {
  if (!str) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return btoa(String.fromCharCode(...data));
  } catch (error) {
    console.error('Base64 encoding failed:', error);
    return btoa(str); // Fallback to basic btoa for simple cases
  }
}

function viewFiltersToQualityFilter(viewFilters: ViewFilter[]): QualityReportFilter {
  const typeFilter = viewFilters.find((f) => f.field === 'type');
  const severityFilter = viewFilters.find((f) => f.field === 'severity');
  return {
    type: typeFilter?.list ?? [],
    severity: severityFilter?.list ?? [],
  };
}
