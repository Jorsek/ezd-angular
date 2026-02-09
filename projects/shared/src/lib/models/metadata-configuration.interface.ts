/**
 * Metadata field type enum - mirrors Java MetadataType
 */
export type MetadataType =
  | 'TEXT'
  | 'TEXT_LIST'
  | 'BOOLEAN'
  | 'LONG'
  | 'TAXONOMY'
  | 'DATE'
  | 'LABEL'
  | 'TEXT_SINGLE_LINE';

/**
 * Metadata field definition - mirrors Java MetadataField
 */
export interface MetadataField {
  name: string;
  displayName: string;
  type: MetadataType;
  metadataSearchWidgetType?: string;
  source?: string;
  allowMultipleSelection?: boolean;
}

/**
 * Field reference within a category
 */
export interface MetadataFieldRef {
  fieldName: string;
  enabled: boolean;
  searchFacet: boolean;
}

/**
 * Metadata category
 */
export interface MetadataCategory {
  label: string;
  fieldRefs: MetadataFieldRef[];
  excludedContentTypes: string[];
  associatedTags: string[];
  includeForBinaryFiles: boolean;
}

/**
 * Metadata configuration response - mirrors Java MetadataConfiguration
 */
export interface MetadataConfiguration {
  version: string;
  allCategories: MetadataCategory[];
  allFields: MetadataField[];
  fieldByName: Record<string, MetadataField>;
  contentTypeToCategory: Record<string, unknown>;
}
