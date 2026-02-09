import { SearchContext } from './search-context.interface';
import { FindCriteria } from './search-criteria.interface';

/**
 * Complete search request payload for the Find API
 * Sent to POST /resources/find or /resources/find/csv
 */
export interface ResourceFindRequest {
  /** Where to search (resource, directory, dependencies) */
  context: SearchContext;

  /** What to search for and how to match */
  criteria: FindCriteria;

  /**
   * Maximum number of results to return
   * Optional: 1-10000, default varies by endpoint
   */
  maxResults?: number;
}

/**
 * @deprecated Use ResourceFindRequest instead. This alias maintained for backwards compatibility.
 */
export type SearchRequest = ResourceFindRequest;
