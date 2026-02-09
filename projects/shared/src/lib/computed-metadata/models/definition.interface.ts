import { DataType } from './data-type.enum';

/**
 * An extracted metadata definition - defines how to extract a value from DITA content.
 * XPath expressions are evaluated in order; first match wins.
 */
export interface ComputedMetadataDefinition {
  id: number;
  /** Human-readable display name */
  name: string;
  /** XML-safe identifier key (lowercase, no spaces) */
  key: string;
  /** Data type for the computed value */
  dataType: DataType;
  /** Whether this field can have multiple values */
  multiValue: boolean;
  defaultValue: string | null;
  xpaths: string[];
  createdUtc: string;
  updatedUtc: string;
}

/**
 * Request to create a new extracted metadata definition.
 */
export interface CreateDefinitionRequest {
  name: string;
  /** XML-safe identifier key (lowercase, no spaces) */
  key: string;
  /** Data type for the computed value */
  dataType: DataType;
  /** Whether this field can have multiple values */
  multiValue: boolean;
  defaultValue?: string;
  xpaths: string[];
}

/**
 * Request to update an existing extracted metadata definition.
 * Note: Updating invalidates all cached values - call recompute to regenerate.
 */
export interface UpdateDefinitionRequest {
  name: string;
  /** XML-safe identifier key (lowercase, no spaces) */
  key: string;
  /** Data type for the computed value */
  dataType: DataType;
  /** Whether this field can have multiple values */
  multiValue: boolean;
  defaultValue?: string;
  xpaths: string[];
}
