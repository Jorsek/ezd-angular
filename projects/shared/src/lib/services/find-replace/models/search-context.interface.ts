/**
 * Search context types for the Find API
 * Defines the scope of the search operation using discriminator pattern
 */
export type SearchContextType =
  | 'SINGLE_RESOURCE'
  | 'RESOURCE_WITH_DEPENDENCIES'
  | 'DIRECTORY_SCOPE';

/**
 * Base interface for all search contexts
 */
interface BaseSearchContext {
  /** Type discriminator for polymorphic context */
  type: SearchContextType;
}

/**
 * Search a single resource
 */
export interface SingleResourceContext extends BaseSearchContext {
  type: 'SINGLE_RESOURCE';
  /** UUID of the resource to search */
  resourceUuid: string;
}

/**
 * Search a resource and its dependencies
 */
export interface ResourceWithDependenciesContext extends BaseSearchContext {
  type: 'RESOURCE_WITH_DEPENDENCIES';
  /** UUID of the resource to search */
  resourceUuid: string;
  /** If true, only search explicit dependencies (not transitive) */
  explicitOnly?: boolean;
}

/**
 * Search a directory
 */
export interface DirectoryScopeContext extends BaseSearchContext {
  type: 'DIRECTORY_SCOPE';
  /** UUID of the directory to search */
  directoryUuid: string;
  /** If true, search subdirectories recursively */
  recursive?: boolean;
}

/**
 * Union type for all search contexts
 */
export type SearchContext =
  | SingleResourceContext
  | ResourceWithDependenciesContext
  | DirectoryScopeContext;
