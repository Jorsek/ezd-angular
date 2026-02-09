/**
 * Filter system interfaces for the Localization Insights dashboard.
 */

import { Observable } from 'rxjs';

/**
 * Represents a selectable option in a filter dropdown.
 * Supports flat lists and hierarchical trees via optional children.
 */
export interface FilterOption {
  /** Unique value used for selection tracking */
  value: string;
  /** Display label shown to user */
  label: string;
  /** Tooltip text shown on hover (HTML title attribute) */
  title?: string;
  /** Child options for hierarchical filters */
  children?: FilterOption[];
}

/** Filter component type determines which UI component to render */
export type FilterType = 'list' | 'taxonomy' | 'text' | 'search' | 'number' | 'date';

/**
 * Configuration for a filter category.
 * Defines how a filter behaves and where to fetch its options.
 */
export interface FilterCategory {
  /** Unique filter identifier (e.g., 'locale', 'localizedStatus') */
  id: string;
  /** Display label (e.g., 'Locale(s)', 'L10N Status') */
  label: string;
  /** Filter component type to render */
  type: FilterType;
  /** Whether this filter is shown by default (vs available via "+ Add") */
  default: boolean;
  /** Whether the filter can be removed from the filter bar */
  removable: boolean;
  /** Single or multi-select mode (only for list/taxonomy types) */
  selectionMode?: 'single' | 'multi';
  /** Whether to show search input in dropdown (only for list/taxonomy types) */
  searchable?: boolean;
  /** Whether this is a metadata-based filter (dynamically generated) */
  metadata?: boolean;

  options?: () => Observable<FilterOption[]>;
}

/**
 * Represents an active filter in the filter bar.
 * Combines the category configuration with current options and selection.
 */
export interface ActiveFilter {
  /** Filter category configuration */
  category: FilterCategory;
  /** Currently selected values (for list/taxonomy/text/search types) */
  selectedValues: string[];
  /** Numeric range value (for number type) */
  range?: { min?: number; max?: number };
  /** Date interval value (for date type) */
  interval?: { start?: string; end?: string };
}

/**
 * Emitted when filters are applied.
 * Maps filter IDs to their selected values.
 */
export interface FilterState {
  /** Filter ID -> selected values */
  filters: Record<string, string[]>;
}
