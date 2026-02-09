/**
 * A preview item from the preview SSE stream.
 * Shows what value would be computed for a piece of DITA content.
 */
export interface PreviewItem {
  /** The resource filename */
  filename: string;
  /** TOPIC or MAP */
  ditaType: 'TOPIC' | 'MAP';
  /** The computed value (or default if no XPath matched) */
  value: string | null;
  /** The XPath that matched, or null if default value was used */
  matchedXpath: string | null;
}

/**
 * Progress event from the recompute SSE stream.
 *
 * Backend returns:
 * - start: {"type":"start","total":100}
 * - progress: {"type":"progress","current":50,"total":100}
 * - complete: {"type":"complete","processed":100,"failed":2}
 */
export interface RecomputeProgress {
  /** Event type: start, progress, or complete */
  type: 'start' | 'progress' | 'complete';
  /** Current number of items processed (progress events) */
  current?: number;
  /** Total number of items to process */
  total?: number;
  /** Number of items processed (complete event) */
  processed?: number;
  /** Number of failed items (complete event) */
  failed?: number;
}

/**
 * Complete event from the preview SSE stream.
 * Indicates the stream is finished and provides pagination info.
 */
export interface PreviewComplete {
  /** Number of items returned in this stream */
  returned: number;
  /** True if more items are available (use offset + limit to fetch next page) */
  hasMore: boolean;
}

/**
 * Result of a preview page request.
 * Contains items and pagination info.
 */
export interface PreviewPageResult {
  items: PreviewItem[];
  complete: PreviewComplete;
}

/**
 * Union type for SSE events from preview endpoint.
 */
export type PreviewEvent =
  | { type: 'item'; data: PreviewItem }
  | { type: 'complete'; returned: number; hasMore: boolean }
  | { type: 'error'; data: { message: string } };

/**
 * Union type for SSE events from recompute endpoint.
 */
export type RecomputeEvent =
  | { type: 'progress'; data: RecomputeProgress }
  | { type: 'error'; data: { message: string } };

/**
 * Request for ad-hoc XPath preview (without a saved definition).
 */
export interface AdHocPreviewRequest {
  xpaths: string[];
  defaultValue?: string;
  limit?: number;
  resourceUuid?: string;
}

/**
 * Request for inline XPath preview for a single resource.
 */
export interface InlinePreviewRequest {
  xpaths: string[];
  defaultValue?: string;
  resourceUuid: string;
}

/**
 * Response from inline XPath preview for a single resource.
 */
export interface InlinePreviewResponse {
  filename: string;
  ditaType: 'TOPIC' | 'MAP';
  matchedXpath: string | null;
  values: string[];
}

/**
 * Request for folder-based XPath preview via SSE stream.
 */
export interface FolderPreviewRequest {
  xpaths: string[];
  defaultValue?: string;
  folderUuid: string;
  limit?: number;
  recursive?: boolean;
}

/**
 * A single match within a folder preview item.
 */
export interface FolderPreviewMatch {
  matchedXpath: string;
  values: string[];
}

/**
 * A single item from the folder preview SSE stream.
 */
export interface FolderPreviewItem {
  resource: {
    resourceUuid: string;
    fileName: string;
    ezdPath: string;
    ditaType: 'NON_DITA' | 'MAP' | 'TOPIC';
    branchName: string;
    path: string;
    uuid: string;
    directoryUuid: string;
    ownerUsername: string;
    creatorUsername: string;
    lastModified: string;
    contentMimeType: string;
  };
  matches: FolderPreviewMatch[];
}

/**
 * Start event from folder preview SSE stream.
 */
export interface FolderPreviewStart {
  totalResources: number;
}

/**
 * Progress event from folder preview SSE stream.
 * Sent periodically (every 10 files) during search.
 */
export interface FolderPreviewProgress {
  searched: number;
  total: number;
}

/**
 * Complete event from folder preview SSE stream.
 */
export interface FolderPreviewComplete {
  returned: number;
  hasMore: boolean;
}

/**
 * Union type for folder preview SSE events.
 */
export type FolderPreviewEvent =
  | { type: 'start'; data: FolderPreviewStart }
  | { type: 'progress'; data: FolderPreviewProgress }
  | { type: 'item'; data: FolderPreviewItem }
  | { type: 'complete'; data: FolderPreviewComplete };
