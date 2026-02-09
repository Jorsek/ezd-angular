import { ChartConfig, ChartType, GroupBy, Measure } from './configure-chart/configure-chart';
import { ColumnDef } from '../table/rich-table';
import { ContentInsightDetail } from '../../services/content-report.service';
import { CalloutConfig } from '../reporting/callout-section/callout-config.interface';
import { InsightsView } from '../insights-views';
import { Field } from '../../models/filter-field.interface';
import {
  TextCellComponent,
  LinkCellComponent,
  StatusCellComponent,
  DateCellComponent,
  NumberCellComponent,
} from '../reporting/cell-renderers';

export const STATIC_FILTER_FIELDS: Field[] = [
  { name: 'title', displayName: 'Title', type: 'text', multiSelect: false, metadata: false },
  { name: 'fileName', displayName: 'Filename', type: 'text', multiSelect: false, metadata: false },
  {
    name: 'contentType',
    displayName: 'Content Type',
    type: 'text',
    multiSelect: true,
    metadata: false,
    default: true,
  },
  {
    name: 'fileStatus',
    displayName: 'File Status',
    type: 'text',
    multiSelect: true,
    metadata: false,
    default: true,
  },
  {
    name: 'owner',
    displayName: 'Owner',
    type: 'text',
    multiSelect: true,
    metadata: false,
    default: true,
  },
  {
    name: 'wordCount',
    displayName: 'Word Count',
    type: 'number',
    multiSelect: false,
    metadata: false,
  },
  {
    name: 'charCount',
    displayName: 'Char Count',
    type: 'number',
    multiSelect: false,
    metadata: false,
  },
  {
    name: 'fileSize',
    displayName: 'File Size',
    type: 'number',
    multiSelect: false,
    metadata: false,
  },
  {
    name: 'createdUtc',
    displayName: 'Created',
    type: 'datetime',
    multiSelect: false,
    metadata: false,
  },
  {
    name: 'lastModifiedUtc',
    displayName: 'Last Modified',
    type: 'datetime',
    multiSelect: false,
    metadata: false,
  },
  {
    name: 'folderName',
    displayName: 'Folder Name',
    type: 'text',
    multiSelect: false,
    metadata: false,
  },
  {
    name: 'directoryPath',
    displayName: 'Directory Path',
    type: 'text',
    multiSelect: false,
    metadata: false,
  },
  { name: 'locale', displayName: 'Locale', type: 'text', multiSelect: true, metadata: false },
];

/**
 * Callout configuration mapping IDs to display config.
 */
export const CALLOUT_CONFIG: Record<string, CalloutConfig> = {
  TOTAL_OBJECTS: { id: 'TOTAL_OBJECTS', label: 'Total Files' },
  TOTAL_WORDS: { id: 'TOTAL_WORDS', label: 'Total Words' },
  CONTENT_TYPES: { id: 'CONTENT_TYPES', label: 'Content Types' },
  LOCALES: { id: 'LOCALES', label: 'Locales' },
  TOTAL_FOLDERS: { id: 'TOTAL_FOLDERS', label: 'Total Folders' },
};

export const SYSTEM_FIELDS_COL_DEFS = (
  searchFields: Set<string>,
): ColumnDef<ContentInsightDetail>[] => [
  // describes how to render columns for fields that aren't metadata/computed
  {
    id: 'title',
    label: 'Title',
    visible: true,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: searchFields.has('title') ? TextCellComponent : LinkCellComponent,
      inputs: (row) =>
        searchFields.has('title')
          ? { value: row.title }
          : { text: row.title, resourceUuid: row.resourceUuid },
    },
  },
  {
    id: 'fileName',
    label: 'Filename',
    visible: true,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: LinkCellComponent,
      inputs: (row) => ({ text: row.fileName, resourceUuid: row.resourceUuid }),
    },
  },
  {
    id: 'directoryName',
    label: 'Folder',
    visible: false,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: TextCellComponent,
      inputs: (row) => ({ value: row.folderName }),
    },
  },
  {
    id: 'contentType',
    label: 'Content Type',
    visible: true,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: TextCellComponent,
      inputs: (row) => ({ value: row.contentType }),
    },
  },
  {
    id: 'fileStatus',
    label: 'Status',
    visible: true,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: StatusCellComponent,
      inputs: (row) => ({ value: row.fileStatus, type: 'fileStatus' }),
    },
  },
  {
    id: 'owner',
    label: 'Owner',
    visible: true,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: TextCellComponent,
      inputs: (row) => ({ value: row.owner }),
    },
  },
  {
    id: 'lastModified',
    label: 'Last Modified',
    visible: true,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: DateCellComponent,
      inputs: (row) => ({ value: row.lastModifiedUtc, format: 'datetime' }),
    },
  },
  {
    id: 'wordCount',
    label: 'Word Count',
    visible: false,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: NumberCellComponent,
      inputs: (row) => ({ value: row.wordCount, format: 'integer' }),
    },
  },
  {
    id: 'charCount',
    label: 'Char Count',
    visible: false,
    removable: true,
    sortable: true,
    showOnHover: false,
    textSearchable: false,
    cellComponent: {
      type: NumberCellComponent,
      inputs: (row) => ({ value: row.charCount, format: 'integer' }),
    },
  },
];

export const DEFAULT_CONTENT_VIEW: InsightsView = {
  id: 'default',
  insightType: 'CONTENT',
  name: 'Default View',
  description: 'The default content report view',
  shared: true,
  readOnly: true,
  callouts: ['TOTAL_OBJECTS', 'TOTAL_WORDS', 'CONTENT_TYPES', 'LOCALES'],
  charts: [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      type: 'OBJECTS',
      field: 'contentType',
      options: {
        title: 'Content Types',
        description: '',
        chartType: ChartType.Bar,
        measure: Measure.Objects,
        groupBy: GroupBy.ContentType,
        width: 1,
      } satisfies ChartConfig,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'OBJECTS',
      field: 'fileStatus',
      options: {
        title: 'File Status',
        description: '',
        chartType: ChartType.Bar,
        measure: Measure.Objects,
        groupBy: GroupBy.FileStatus,
        width: 1,
      } satisfies ChartConfig,
    },
  ],
  columns: [
    // system fields here must be defined in SYSTEM_FIELDS_COL_DEFS, or they won't render
    { field: 'title' },
    { field: 'fileName' },
    { field: 'directoryName' },
    { field: 'contentType' },
    { field: 'fileStatus' },
    { field: 'owner' },
    { field: 'lastModified' },
  ],
  filters: [{ field: 'fileStatus' }, { field: 'owner' }, { field: 'contentType' }],
  sorts: [{ field: 'title', ascending: true }],
};
