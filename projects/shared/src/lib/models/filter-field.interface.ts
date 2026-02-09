import { MetadataType } from './metadata-configuration.interface';
import { DataType } from '../computed-metadata/models/data-type.enum';

/** Normalized field type across metadata and extracted metadata */
export type FieldType = 'text' | 'boolean' | 'taxonomy' | 'label' | 'number' | 'datetime';

/** Unified field descriptor for filtering */
export interface Field {
  /** Prefixed ID: 'metadata:author' or 'computed:word_count' */
  name: string;
  /** Human-readable label */
  displayName: string;
  /** Normalized type */
  type: FieldType;
  /** Whether the field supports multiple values */
  multiSelect: boolean;
  /** Whether this field comes from metadata/extracted metadata configuration */
  metadata: boolean;
  /** Whether this field is shown by default */
  default?: boolean;
  /** Whether this field comes from extracted metadata definitions */
  computed?: boolean;
}

const METADATA_TYPE_MAP: Record<MetadataType, FieldType> = {
  TEXT: 'text',
  TEXT_LIST: 'text',
  TEXT_SINGLE_LINE: 'text',
  BOOLEAN: 'boolean',
  TAXONOMY: 'taxonomy',
  LABEL: 'label',
  LONG: 'number',
  DATE: 'datetime',
};

const DATA_TYPE_MAP: Record<DataType, FieldType> = {
  TEXT: 'text',
  DECIMAL: 'number',
  BOOLEAN: 'boolean',
  DATE: 'datetime',
};

/** Maps a MetadataType to a normalized FieldType */
export function mapMetadataType(type: MetadataType): FieldType {
  return METADATA_TYPE_MAP[type];
}

/** Maps an extracted metadata DataType to a normalized FieldType */
export function mapDataType(type: DataType): FieldType {
  return DATA_TYPE_MAP[type];
}
