/**
 * Data types for extracted metadata values.
 * Determines how the extracted value is processed and stored.
 */
export type DataType = 'TEXT' | 'DECIMAL' | 'BOOLEAN' | 'DATE';

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  TEXT: 'Text',
  DECIMAL: 'Number',
  BOOLEAN: 'Boolean',
  DATE: 'Date/Time',
};
