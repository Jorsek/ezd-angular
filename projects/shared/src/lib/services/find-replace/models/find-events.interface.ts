/**
 * Resource information in search results
 */
export interface ResourceInfo {
  /** Unique identifier for the resource */
  uuid: string;

  /** Full path to the resource file */
  path: string;

  /** File name only */
  fileName: string;
}

/**
 * Individual match within a file
 * Part of the file-matches event batch
 */
export interface MatchLocation {
  /** XPath to the matched element/attribute (null for raw text search) */
  xpath: string | null;

  /** Context string (~100 chars) containing the match */
  context: string;

  /** Character offset where match starts within context */
  matchStart: number;

  /** Character offset where match ends within context */
  matchEnd: number;
}

/**
 * Batch of matches for a single file
 * Emitted via SSE 'file-matches' event
 */
export interface FileMatches {
  /** Resource where matches were found */
  resource: ResourceInfo;

  /** Array of matches found in this file */
  matches: MatchLocation[];
}

/**
 * Search started event data
 * Emitted via SSE 'task-started' event (first event)
 */
export interface FindStarted {
  /** Unique task identifier for cancellation */
  taskId: string;

  /** Total number of resources that will be searched */
  totalResources: number;
}

/**
 * Search progress update
 * Emitted via SSE 'progress' event (periodic updates)
 */
export interface FindProgress {
  /** Number of resources processed so far */
  resourcesProcessed: number;

  /** Total number of resources to process */
  totalResources: number;

  /** Number of matches found so far */
  matchesFound: number;
}

/**
 * Search completed event data
 * Emitted via SSE 'find-completed' event (final event)
 */
export interface FindCompleted {
  /** Total number of matches found */
  totalMatches: number;

  /** Total number of resources searched */
  totalResources: number;

  /** Number of resources that contained matches */
  resourcesWithMatches: number;

  /** Duration of the search in milliseconds */
  durationMs: number;
}

/**
 * Error response from Find API
 */
export interface FindError {
  /** HTTP status code */
  status: number;

  /** Error type */
  error: string;

  /** Error message */
  message: string;

  /** Number of matches found (for RESULT_SET_TOO_LARGE errors) */
  matchesFound?: number;

  /** Threshold limit (for RESULT_SET_TOO_LARGE errors) */
  threshold?: number;

  /** CSV endpoint URL (for RESULT_SET_TOO_LARGE errors) */
  csvEndpoint?: string;
}

/**
 * Union type for all SSE events
 */
export type FindEvent =
  | { type: 'task-started'; data: FindStarted }
  | { type: 'file-matches'; data: FileMatches }
  | { type: 'progress'; data: FindProgress }
  | { type: 'find-completed'; data: FindCompleted }
  | { type: 'error'; data: FindError };

/**
 * @deprecated Use MatchLocation instead. This is for backwards compatibility.
 */
export interface FindMatch {
  resource: ResourceInfo;
  xpath: string;
  matchText: string;
  matchStart: number;
  matchEnd: number;
  lineNumber: number;
  columnNumber: number;
}
