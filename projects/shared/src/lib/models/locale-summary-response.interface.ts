import { Locale } from './localization-insights.interface';

export interface LocaleSummary {
  OUTDATED: number;
  MISSING: number;
  CURRENT: number;
}

export interface LocaleEntry {
  summary: LocaleSummary;
  total: number;
}

export interface ResourcesSummary {
  OUTDATED: number;
  MISSING: number;
  CURRENT: number;
}

export interface JobsSummary {
  CANCELLED: number;
  COMPLETED: number;
  ACTIVE: number;
  OVERDUE: number;
}

export interface Resources {
  summary: ResourcesSummary;
  total: number;
}

export interface Jobs {
  summary: JobsSummary;
  total: number;
}

export interface WordCount {
  summary: {
    OUTDATED: number;
    MISSING: number;
    CURRENT: number;
  };
  total: number;
}

/** Callouts returned by the backend summary endpoint */
export interface SummaryCallouts {
  TOTAL_RESOURCES: number;
  TOTAL_WORDS: number;
  TOTAL_JOBS: number;
  TOTAL_LOCALES: number;
}

/** Summary result for dynamic chart data */
export interface SummaryResult {
  name: string;
  value: number;
  /** Stack name for stacked charts (returned by backend in summaries when stackBy is specified) */
  stack?: string;
}

/** Stacked summary result with category and stack */
export interface StackedSummaryResult {
  category: string;
  stack: string;
  value: number;
}

export interface LocaleSummaryResponse {
  locales: Locale[];
  jobs: Jobs;
  includesJobs: number[];
  summary: {
    [localeCode: string]: LocaleEntry;
  };
  resourceStatus: Resources;
  wordCount: WordCount;
  wordCountByLocale: {
    [localeCode: string]: WordCount;
  };
  resources: Resources;
  resourceStatusByLocale: {
    [localeCode: string]: LocaleEntry;
  };
  /** Callouts with aggregated totals - optional until backend is updated */
  callouts?: SummaryCallouts;
  /** Dynamic summary results keyed by chart ID */
  summaries?: Record<string, SummaryResult[]>;
  /** Stacked summary results for charts with stackBy */
  stackedSummaries?: Record<string, StackedSummaryResult[]>;
}
