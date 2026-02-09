/**
 * Localization Insights API types.
 * Based on the React project's locale-insights.ts types.
 */

import { Context } from './server-context.interface';

// ============================================
// Enums and Status Types
// ============================================

/**
 * Localization status values for resources.
 * Maps to Java LocalizationStatus enum.
 */
export const RESOURCE_STATUS_VALUES = [
  { value: 'CURRENT', label: 'Current' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'OUTDATED', label: 'Out-of-date' },
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUS_VALUES)[number]['value'];

export type JobStatus = 'CANCELLED' | 'COMPLETED' | 'ACTIVE';
export type SortDirection = 'asc' | 'desc';
export type Sort = { column: string | null; direction: SortDirection };

// ============================================
// Locale Types
// ============================================

export interface Locale {
  code: string;
  displayName: string;
}

/**
 * Job returned from the /api/localization/insights/jobs endpoint.
 * Matches JobDetail record from turbo-dita.
 */
export interface LocalizationJob {
  id: number;
  uri: string;
  locale: string;
  filename: string;
  ditaType: string;
  status: JobStatus;
}

export interface LocalesMap {
  [localeCode: string]: string;
}

// ============================================
// Summary Types
// ============================================

export type ResourceSummary = Record<ResourceStatus, number>;

export interface JobSummary {
  CANCELLED: number;
  COMPLETED: number;
  ACTIVE: number;
}

export interface ResourcesData {
  summary: ResourceSummary;
  total: number;
}

export interface JobsData {
  summary: JobSummary;
  total: number;
}

export interface LocaleSummary {
  summary: ResourceSummary;
  total: number;
}

export interface SummaryData {
  [localeCode: string]: LocaleSummary;
}

export interface LocaleInsightsData {
  resources: ResourcesData;
  jobs: JobsData;
  summary: SummaryData;
  locales: LocalesMap;
  includesJobs: number[];
}

// ============================================
// Resource/Detail Types
// ============================================

export interface InsightsMetadata {
  [key: string]: string;
}

export interface ResourceItem {
  id: number;
  filename: string;
  mapFilename: string;
  localizationStatus: ResourceStatus;
  sourceResourceUuid: string;
  locale: Locale;
  due: string;
  jobs: number[];
  metadata: InsightsMetadata;
}

export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface ResourceListResponse {
  content: ResourceItem[];
  page: PageInfo;
}

// ============================================
// Filter/Request Types
// ============================================

/**
 * Due date filter options for localization resources.
 * Maps to Java LocalizedResourceDue enum.
 */
export const RESOURCE_DUE_VALUES = ['OVERDUE', 'THIS_WEEK', 'THIS_MONTH'] as const;
export type ResourceDue = (typeof RESOURCE_DUE_VALUES)[number];

/**
 * Job status filter options.
 * Maps to Java LocalizationJobStatus enum.
 */
export const JOB_STATUS_VALUES = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE'] as const;
export type LocalizationJobStatus = (typeof JOB_STATUS_VALUES)[number];

/**
 * Filter payload sent to the insights API endpoints.
 * Matches LocalizationResourceFilter class structure.
 */
export interface InsightsResourceFilter {
  context?: Context;
  searchTerms?: string[];
  statuses?: ResourceStatus[];
  jobStatus?: LocalizationJobStatus[];
  locales?: string[];
  jobId?: number[];
  due?: ResourceDue[];
  metadata?: Record<string, string[]>;
  sourceResourceUuids?: string[];
}

/**
 * Root map information returned from /localization/insights/root-maps endpoint.
 * Used to populate the map filter dropdown.
 */
export interface LocalizationRootMapInfo {
  resourceUuid: string;
  resourceUri: string;
  resourceTitle: string | null;
  releaseName: string | null;
}

/**
 * Paginated response for root maps endpoint.
 */
export interface RootMapsResponse {
  content: LocalizationRootMapInfo[];
  page: PageInfo;
}

/**
 * Parameters for the detail endpoint.
 */
export interface DetailsParameters {
  filter: InsightsResourceFilter;
  sort?: Record<string, SortDirection>;
  page?: number;
  size?: number;
}

// ============================================
// Refresh Response Types
// ============================================

/**
 * Response from the insights refresh endpoint.
 */
export interface RefreshResponse {
  timestamp: string;
  count: number;
}

/**
 * Result of a refresh operation, includes success status.
 */
export interface RefreshResult {
  success: boolean;
  timestamp?: string;
  count?: number;
}

// CSV Download types are now in BaseInsightsService
// Use CsvColumn from '../services/base-insights.service'
