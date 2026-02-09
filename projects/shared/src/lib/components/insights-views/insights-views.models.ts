/**
 * TypeScript models for the Insights Views API
 * Based on com.heretto.ccms.insights.view.controller.dto.* Java classes
 */

// ============================================================================
// Enums
// ============================================================================

/** Insight type for views */
export type InsightsType = 'CONTENT' | 'LOCALIZATION' | 'QUALITY' | 'REUSE';

// ============================================================================
// Child Entity Types (shared between request and response)
// ============================================================================

/** Chart configuration with aggregation type, field, and display options */
export interface InsightsViewChart {
  id: string; // unique identifier for the chart
  type: string; // aggregation type: 'OBJECTS', 'WORDS'
  field: string; // field to aggregate by (camelCase)
  options?: unknown; // should be a json safe object
}

/** Display options for chart rendering */
export interface InsightsViewChartOptions {
  chartType: 'pie' | 'bar';
}

/** Column configuration */
export interface InsightsViewColumn {
  field: string;
}

/** Filter configuration stored in views and sent to the API */
export interface ViewFilter {
  field: string;
  list?: string[];
  value?: string;
  range?: { min?: number; max?: number };
  interval?: { start?: string; end?: string };
  search?: string[];
}

/** Sort configuration with field and direction */
export interface InsightsViewSort {
  field: string;
  ascending: boolean;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request body for creating or updating an insights view.
 *
 * Child entities (callouts, charts, columns, filters, sorts) are replaced entirely on update.
 * Ordinal values for columns and sorts are derived from list position.
 */
export interface InsightsViewRequest {
  id?: string;
  name: string;
  description?: string;
  shared: boolean;
  callouts?: string[];
  charts?: InsightsViewChart[];
  columns?: InsightsViewColumn[];
  filters?: ViewFilter[];
  sorts?: InsightsViewSort[];
}

// ============================================================================
// View Types
// ============================================================================

/**
 * An insights view with all child entities.
 *
 * The `shared` field indicates whether this is a shared view (available to all users)
 * or a user-specific view.
 */
export interface InsightsView {
  id: string;
  insightType: InsightsType;
  name: string;
  description?: string;
  shared: boolean;
  readOnly?: boolean;
  callouts: string[];
  charts: InsightsViewChart[];
  columns: InsightsViewColumn[];
  filters: ViewFilter[];
  sorts: InsightsViewSort[];
}

/**
 * Summary of an insights view for list responses.
 * Does not include child entities (callouts, charts, columns, filters, sorts).
 */
export interface InsightsViewSummary {
  id: string;
  name: string;
  description?: string;
  shared: boolean;
}
