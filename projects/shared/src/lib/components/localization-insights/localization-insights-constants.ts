import { FilterCategory } from '../../models/filter.interface';
import { InsightsView } from '../insights-views';
import { Field, FieldType } from '../../models/filter-field.interface';
import {
  ChartType,
  ChartWidth,
  ChartHeight,
} from '../content-report/configure-chart/configure-chart';

/** Field definition for localization - extends Field with column-specific properties */
export interface LocalizationField extends Field {
  type: FieldType;
  visible: boolean;
  removable: boolean;
  sortable: boolean;
}

/** System fields for localization insights table */
export const LOCALIZATION_SYSTEM_FIELDS: LocalizationField[] = [
  {
    name: 'fileName',
    displayName: 'Filename',
    type: 'text',
    multiSelect: false,
    metadata: false,
    visible: true,
    removable: false,
    sortable: true,
  },
  {
    name: 'title',
    displayName: 'Title',
    type: 'text',
    multiSelect: false,
    metadata: false,
    visible: true,
    removable: false,
    sortable: true,
  },
  {
    name: 'locale',
    displayName: 'Locale',
    type: 'text',
    multiSelect: false,
    metadata: false,
    visible: true,
    removable: false,
    sortable: true,
  },
  {
    name: 'jobs',
    displayName: 'Jobs',
    type: 'text',
    multiSelect: true,
    metadata: false,
    visible: false,
    removable: true,
    sortable: false,
  },
  {
    name: 'fileStatus',
    displayName: 'File Status',
    type: 'text',
    multiSelect: false,
    metadata: false,
    visible: true,
    removable: true,
    sortable: true,
  },
  {
    name: 'l10nStatus',
    displayName: 'L10N Status',
    type: 'text',
    multiSelect: false,
    metadata: false,
    visible: true,
    removable: true,
    sortable: true,
  },
  {
    name: 'dueDate',
    displayName: 'Due Date',
    type: 'datetime',
    multiSelect: false,
    metadata: false,
    visible: true,
    removable: true,
    sortable: true,
  },
  {
    name: 'wordCount',
    displayName: 'Word Count',
    type: 'number',
    multiSelect: false,
    metadata: false,
    visible: false,
    removable: true,
    sortable: true,
  },
  {
    name: 'charCount',
    displayName: 'Char Count',
    type: 'number',
    multiSelect: false,
    metadata: false,
    visible: false,
    removable: true,
    sortable: true,
  },
  {
    name: 'mimeType',
    displayName: 'Mime Type',
    type: 'text',
    multiSelect: false,
    metadata: false,
    visible: false,
    removable: true,
    sortable: true,
  },
];

/**
 * Static filter categories for localization insights.
 * These are localization-specific filters (not derived from metadata).
 */
export const STATIC_LOCALIZATION_FILTERS: FilterCategory[] = [
  // Default filters (always visible)
  {
    id: 'locale',
    label: 'Locale(s)',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    // options provided by component
  },
  {
    id: 'localizedStatus',
    label: 'L10N Status',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    // options provided by component
  },
  {
    id: 'fileStatus',
    label: 'File Status',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    // options provided by component
  },
  {
    id: 'map',
    label: 'Map',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: true,
    // options provided by component
  },
  // Addable filters (via "+ Add" button)
  {
    id: 'due',
    label: 'Due Date',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'single',
    searchable: false,
    // options provided by component
  },
  {
    id: 'job',
    label: 'Job(s)',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: false,
    // options provided by component
  },
  {
    id: 'jobStatus',
    label: 'Job Status',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: false,
    // options provided by component
  },
];

/** Default view configuration for localization insights */
export const DEFAULT_LOCALIZATION_VIEW: InsightsView = {
  id: 'default',
  insightType: 'LOCALIZATION',
  name: 'Default View',
  description: 'Default localization insights view',
  shared: true,
  readOnly: true,
  callouts: ['TOTAL_RESOURCES', 'TOTAL_WORDS', 'TOTAL_JOBS', 'TOTAL_LOCALES'],
  charts: [
    {
      id: 'statusBreakdown',
      type: 'RESOURCES',
      field: 'resourceStatus',
      options: {
        title: 'Localization Status',
        description: '',
        chartType: ChartType.Pie,
        measure: 'RESOURCES',
        groupBy: 'resourceStatus',
        width: ChartWidth.One,
        height: ChartHeight.One,
      },
    },
    {
      id: 'statusByLocale',
      type: 'RESOURCES',
      field: 'locale',
      options: {
        title: 'Status by Language',
        description: '',
        chartType: ChartType.Bar,
        measure: 'RESOURCES',
        groupBy: 'locale',
        stackBy: 'resourceStatus',
        width: ChartWidth.Three,
        height: ChartHeight.Two,
      },
    },
    {
      id: 'wordsByStatus',
      type: 'WORDS',
      field: 'resourceStatus',
      options: {
        title: 'Translated Words',
        description: '',
        chartType: ChartType.Pie,
        measure: 'WORDS',
        groupBy: 'resourceStatus',
        width: ChartWidth.One,
        height: ChartHeight.One,
      },
    },
  ],
  columns: [
    { field: 'fileName' },
    { field: 'title' },
    { field: 'locale' },
    { field: 'jobs' },
    { field: 'fileStatus' },
    { field: 'l10nStatus' },
    { field: 'dueDate' },
  ],
  filters: [],
  sorts: [{ field: 'fileName', ascending: true }],
};
