import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AdHocPreviewRequest,
  ComputedMetadataDefinition,
  CreateDefinitionRequest,
  UpdateDefinitionRequest,
  PreviewItem,
  RecomputeProgress,
  InlinePreviewRequest,
  InlinePreviewResponse,
  FolderPreviewRequest,
  FolderPreviewEvent,
} from '../models';
import { fetchSSE } from '../../utils/sse.util';

/**
 * Service for interacting with the Extracted Metadata API.
 *
 * Provides methods to:
 * - CRUD operations for metadata definitions
 * - Preview computed values via SSE stream
 * - Recompute all values with progress via SSE stream
 */
@Injectable({
  providedIn: 'root',
})
export class ComputedMetadataService {
  private http = inject(HttpClient);

  private readonly baseUrl = '/ezdnxtgen/api/turbo/proxy/computed-metadata';
  // Direct route to turbo-dita for SSE (bypasses ezd proxy buffering)
  private readonly sseBaseUrl = '/turbo-direct/computed-metadata';

  // TODO: Remove when backend supports dataType/multiValue fields
  /**
   * Normalize a definition response by applying default values for fields
   * the backend doesn't yet return (dataType, multiValue).
   */
  private normalizeDefinition(def: ComputedMetadataDefinition): ComputedMetadataDefinition {
    return {
      ...def,
      dataType: def.dataType ?? 'TEXT',
      multiValue: def.multiValue ?? false,
    };
  }

  // ==================== CRUD Operations ====================

  /**
   * List all extracted metadata definitions.
   */
  listDefinitions(): Observable<ComputedMetadataDefinition[]> {
    return this.http
      .get<ComputedMetadataDefinition[]>(`${this.baseUrl}/definitions`)
      .pipe(map((defs) => defs.map((d) => this.normalizeDefinition(d))));
  }

  /**
   * Get a single definition by ID.
   */
  getDefinition(id: number): Observable<ComputedMetadataDefinition> {
    return this.http
      .get<ComputedMetadataDefinition>(`${this.baseUrl}/definitions/${id}`)
      .pipe(map((def) => this.normalizeDefinition(def)));
  }

  /**
   * Create a new definition.
   */
  createDefinition(request: CreateDefinitionRequest): Observable<ComputedMetadataDefinition> {
    return this.http
      .post<ComputedMetadataDefinition>(`${this.baseUrl}/definitions`, request)
      .pipe(map((def) => this.normalizeDefinition(def)));
  }

  /**
   * Update an existing definition.
   * Note: This invalidates all cached values. Call recompute() to regenerate.
   */
  updateDefinition(
    id: number,
    request: UpdateDefinitionRequest,
  ): Observable<ComputedMetadataDefinition> {
    return this.http
      .put<ComputedMetadataDefinition>(`${this.baseUrl}/definitions/${id}`, request)
      .pipe(map((def) => this.normalizeDefinition(def)));
  }

  /**
   * Delete a definition.
   */
  deleteDefinition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/definitions/${id}`);
  }

  /**
   * Reorder definitions by providing the new order of definition IDs.
   */
  reorderDefinitions(definitionIds: number[]): Observable<ComputedMetadataDefinition[]> {
    return this.http
      .put<ComputedMetadataDefinition[]>(`${this.baseUrl}/definitions/reorder`, { definitionIds })
      .pipe(map((defs) => defs.map((d) => this.normalizeDefinition(d))));
  }

  // ==================== Inline Preview ====================

  /**
   * Preview XPath expressions for a single resource.
   * Returns the matched values for the specified resource.
   *
   * @param request - XPath expressions, optional default value, and resource UUID
   */
  previewInline(request: InlinePreviewRequest): Observable<InlinePreviewResponse> {
    return this.http.post<InlinePreviewResponse>(`${this.baseUrl}/preview`, request);
  }

  /**
   * Preview XPath expressions for all DITA resources in a folder via SSE stream.
   * Uses fetch instead of EventSource since the endpoint is POST.
   */
  previewFolder(request: FolderPreviewRequest): Observable<FolderPreviewEvent> {
    return fetchSSE(`${this.baseUrl}/preview/folder`, {
      method: 'POST',
      body: request,
      isComplete: (ev) => ev.event === 'complete',
    }).pipe(map((ev) => ({ type: ev.event, data: ev.data }) as FolderPreviewEvent));
  }

  // ==================== SSE Streams ====================

  /**
   * Preview computed values for a definition via SSE stream.
   * Emits each item as it arrives, then emits a complete event.
   *
   * @param id - Definition ID
   * @param offset - Number of items to skip (default: 0)
   * @param limit - Maximum items to return (default: 50, max: 100)
   */
  previewStream(
    id: number,
    offset = 0,
    limit = 50,
  ): Observable<{ type: 'item'; item: PreviewItem } | { type: 'complete'; hasMore: boolean }> {
    const url = `${this.sseBaseUrl}/definitions/${id}/preview?offset=${offset}&limit=${limit}`;
    return new Observable((observer) => {
      const eventSource = new EventSource(url);
      let completed = false;

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'item') {
            // Wrapped format: { type: 'item', data: PreviewItem }
            observer.next({ type: 'item', item: parsed.data });
          } else if (parsed.type === 'complete') {
            // Complete event
            completed = true;
            const completeData = parsed.data ?? parsed;
            observer.next({ type: 'complete', hasMore: completeData.hasMore ?? false });
            observer.complete();
            eventSource.close();
          } else if (parsed.filename) {
            // Unwrapped format: PreviewItem directly (has filename field)
            observer.next({ type: 'item', item: parsed as PreviewItem });
          }
        } catch (e) {
          console.error('Failed to parse SSE message:', event.data, e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!completed) {
          // Stream closed - emit complete with hasMore=false
          observer.next({ type: 'complete', hasMore: false });
          observer.complete();
        }
      };

      return () => eventSource.close();
    });
  }

  /**
   * Preview XPath expressions without a saved definition (ad-hoc preview).
   * Streams preview items as they are computed.
   *
   * @param request - XPath expressions and optional default value
   */
  previewXpaths(
    request: AdHocPreviewRequest,
  ): Observable<{ type: 'item'; item: PreviewItem } | { type: 'complete'; hasMore: boolean }> {
    const params = new URLSearchParams();
    request.xpaths.forEach((xpath) => params.append('xpath', xpath));
    if (request.defaultValue) {
      params.append('defaultValue', request.defaultValue);
    }
    if (request.limit) {
      params.append('limit', request.limit.toString());
    }
    if (request.resourceUuid) {
      params.append('resourceUuid', request.resourceUuid);
    }

    const url = `${this.sseBaseUrl}/preview?${params.toString()}`;
    return new Observable((observer) => {
      const eventSource = new EventSource(url);
      let completed = false;

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'item') {
            observer.next({ type: 'item', item: parsed.data });
          } else if (parsed.type === 'complete') {
            completed = true;
            const completeData = parsed.data ?? parsed;
            observer.next({ type: 'complete', hasMore: completeData.hasMore ?? false });
            observer.complete();
            eventSource.close();
          } else if (parsed.filename) {
            observer.next({ type: 'item', item: parsed as PreviewItem });
          }
        } catch (e) {
          console.error('Failed to parse SSE message:', event.data, e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!completed) {
          observer.next({ type: 'complete', hasMore: false });
          observer.complete();
        }
      };

      return () => eventSource.close();
    });
  }

  /**
   * Recompute all values for a definition via SSE stream.
   * Streams progress events as items are processed.
   *
   * @param id - Definition ID
   */
  recompute(id: number): Observable<RecomputeProgress> {
    return fetchSSE(`${this.baseUrl}/definitions/${id}/recompute`, {
      isComplete: (ev) => (ev.data as RecomputeProgress).type === 'complete',
    }).pipe(map((ev) => ev.data as RecomputeProgress));
  }
}
