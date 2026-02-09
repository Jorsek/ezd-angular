import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, catchError, finalize, timeout } from 'rxjs/operators';
import {
  ResourceFindRequest,
  FindEvent,
  FileMatches,
  FindStarted,
  FindProgress,
  FindCompleted,
  FindError,
  SearchContext,
  SingleResourceContext,
  FindCriteria,
  ContentType,
} from './models';

/**
 * Service for interacting with the Find/Replace API
 *
 * Provides methods to:
 * - Execute searches with progressive SSE results
 * - Download complete result sets as CSV
 * - Cancel running tasks
 * - Handle threshold exceeded errors
 *
 * Uses RxJS operators for declarative stream handling
 */
@Injectable({
  providedIn: 'root',
})
export class FindReplaceService {
  private http = inject(HttpClient);

  // API base URL - routes through EZD proxy
  // todo: this would have to change. Either this hit an ezd endpoint, or the proxy is changed
  //  to be a general proxy. (Currently it is admin only)
  private readonly baseUrl = '/ezdnxtgen/api/turbo/proxy';

  // Default timeout for search operations (5 minutes)
  private readonly searchTimeoutMs = 300000;

  /**
   * Execute a find operation with progressive results via Server-Sent Events
   *
   * Uses RxJS operators for declarative stream processing:
   * - from() converts fetch Promise to Observable
   * - switchMap() processes the SSE stream
   * - timeout() auto-cancels long-running searches
   * - catchError() handles errors uniformly
   * - finalize() ensures cleanup on complete/error/unsubscribe
   *
   * @param request - Search request configuration
   * @returns Observable that emits FindEvents as they arrive from the server
   *
   * @example
   * ```typescript
   * const subscription = service.executeFind(searchRequest).subscribe({
   *   next: (event) => {
   *     if (event.type === 'file-matches') {
   *       displayFileMatches(event.data);
   *     }
   *   },
   *   error: (err) => handleError(err),
   *   complete: () => console.log('Search complete')
   * });
   *
   * // To cancel: subscription.unsubscribe()
   * ```
   */
  executeFind(request: ResourceFindRequest): Observable<FindEvent> {
    const controller = new AbortController();

    return from(this.fetchSSEStream(request, controller.signal)).pipe(
      switchMap((response) => this.processSSEResponse(response, controller.signal)),
      timeout(this.searchTimeoutMs),
      catchError((error) => this.handleStreamError(error)),
      finalize(() => controller.abort()),
    );
  }

  /**
   * Download complete search results as CSV file
   * Use this when SSE endpoint returns threshold exceeded error
   *
   * @param request - Search request configuration
   * @returns Observable that emits the CSV file as a Blob
   *
   * @example
   * ```typescript
   * service.downloadCsv(searchRequest).subscribe({
   *   next: (blob) => {
   *     const url = window.URL.createObjectURL(blob);
   *     const a = document.createElement('a');
   *     a.href = url;
   *     a.download = 'find-results.csv';
   *     a.click();
   *   }
   * });
   * ```
   */
  downloadCsv(request: ResourceFindRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/resources/find/csv`, request, {
      responseType: 'blob',
      headers: {
        Accept: 'text/csv',
      },
    });
  }

  /**
   * Fetch the SSE stream from the server
   * Returns a Promise<Response> that can be converted to Observable
   */
  private async fetchSSEStream(
    request: ResourceFindRequest,
    signal: AbortSignal,
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/resources/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw this.createErrorFromResponse(errorBody);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    return response;
  }

  /**
   * Process the SSE response stream into FindEvents
   * Returns an Observable that emits events as they are parsed
   */
  private processSSEResponse(response: Response, signal: AbortSignal): Observable<FindEvent> {
    return new Observable<FindEvent>((observer) => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();

            if (done) {
              observer.complete();
              break;
            }

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages (separated by double newline)
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep incomplete message in buffer

            for (const message of messages) {
              if (message.trim() === '') continue;

              const event = this.parseSSEMessage(message);
              if (event) {
                observer.next(event);

                // Auto-complete on find-completed event
                if (event.type === 'find-completed') {
                  observer.complete();
                  return;
                }

                // Auto-complete on error event
                if (event.type === 'error') {
                  observer.error(event);
                  return;
                }
              }
            }
          }
        } catch (error) {
          // Check if this was an abort (user cancelled)
          if (signal.aborted) {
            observer.complete();
            return;
          }

          observer.error(error);
        }
      };

      processStream();

      // Cleanup on unsubscribe
      return () => {
        reader.cancel();
      };
    });
  }

  /**
   * Handle errors from the stream processing
   * Converts various error types into standardized FindEvent errors
   */
  private handleStreamError(error: unknown): Observable<FindEvent> {
    // Timeout error from RxJS
    if (error instanceof Error && error.name === 'TimeoutError') {
      return of(
        this.createErrorEvent({
          status: 408,
          error: 'Request Timeout',
          message: 'Search operation timed out after 5 minutes',
        }),
      );
    }

    // Abort error (user cancelled)
    if (error instanceof Error && error.name === 'AbortError') {
      // Return empty observable to complete silently
      return of();
    }

    // Already a FindEvent error
    if (this.isFindEvent(error) && error.type === 'error') {
      return throwError(() => error);
    }

    // Generic error
    return of(
      this.createErrorEvent({
        status: 0,
        error: 'Network Error',
        message: error instanceof Error ? error.message : 'Network request failed',
      }),
    );
  }

  /**
   * Parse an SSE message into a FindEvent
   * SSE format: "event: eventName\ndata: {...}\n\n"
   */
  private parseSSEMessage(message: string): FindEvent | null {
    const lines = message.split('\n');
    let eventType = '';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.substring(5).trim();
      }
    }

    if (!eventType || !eventData) {
      return null;
    }

    try {
      const data = JSON.parse(eventData);

      switch (eventType) {
        case 'task-started':
          return { type: 'task-started', data: data as FindStarted };
        case 'file-matches':
          return { type: 'file-matches', data: data as FileMatches };
        case 'progress':
          return { type: 'progress', data: data as FindProgress };
        case 'find-completed':
          return { type: 'find-completed', data: data as FindCompleted };
        default:
          console.warn(`Unknown SSE event type: ${eventType}`);
          return null;
      }
    } catch (error) {
      console.error('Failed to parse SSE event data:', error);
      return null;
    }
  }

  /**
   * Create a standardized error event
   */
  private createErrorEvent(error: Partial<FindError>): FindEvent {
    return {
      type: 'error',
      data: {
        status: error.status || 500,
        error: error.error || 'Unknown Error',
        message: error.message || 'An unexpected error occurred',
        matchesFound: error.matchesFound,
        threshold: error.threshold,
        csvEndpoint: error.csvEndpoint,
      },
    };
  }

  /**
   * Build a complete search request from form state
   *
   * This method consolidates request building logic that was previously
   * scattered in the component, making it reusable and testable.
   *
   * @param formState - Search form state (pattern, options, etc.)
   * @param scopeState - Search scope state (context type, UUIDs, etc.)
   * @returns Complete ResourceFindRequest ready for API
   */
  buildSearchRequest(
    formState: {
      pattern: string;
      useRegex: boolean;
      caseSensitive: boolean;
      wholeWordsOnly: boolean;
      ignoreWhitespace: boolean;
      contentTypes: ContentType[];
      xpathRestriction: string;
    },
    scopeState: {
      contextType: SearchContext['type'];
      resourceUuid: string;
      directoryUuid: string;
      recursive: boolean;
      explicitOnly: boolean;
    },
  ): ResourceFindRequest {
    return {
      context: this.buildContext(scopeState),
      criteria: this.buildCriteria(formState),
      maxResults: 10000,
    };
  }

  /**
   * Build search context from scope state
   */
  private buildContext(scopeState: {
    contextType: SearchContext['type'];
    resourceUuid: string;
    directoryUuid: string;
    recursive: boolean;
    explicitOnly: boolean;
  }): SearchContext {
    switch (scopeState.contextType) {
      case 'SINGLE_RESOURCE':
        return {
          type: 'SINGLE_RESOURCE',
          resourceUuid: scopeState.resourceUuid,
        } as SingleResourceContext;

      case 'RESOURCE_WITH_DEPENDENCIES':
        return {
          type: 'RESOURCE_WITH_DEPENDENCIES',
          resourceUuid: scopeState.resourceUuid,
          explicitOnly: scopeState.explicitOnly,
        };

      case 'DIRECTORY_SCOPE':
        return {
          type: 'DIRECTORY_SCOPE',
          directoryUuid: scopeState.directoryUuid,
          recursive: scopeState.recursive,
        };

      default:
        return {
          type: 'SINGLE_RESOURCE',
          resourceUuid: scopeState.resourceUuid,
        } as SingleResourceContext;
    }
  }

  /**
   * Build search criteria from form state
   */
  private buildCriteria(formState: {
    pattern: string;
    useRegex: boolean;
    caseSensitive: boolean;
    wholeWordsOnly: boolean;
    ignoreWhitespace: boolean;
    contentTypes: ContentType[];
    xpathRestriction: string;
  }): FindCriteria {
    const criteria: FindCriteria = {
      pattern: formState.pattern,
      regex: formState.useRegex,
      caseSensitive: formState.caseSensitive,
      wholeWordsOnly: formState.wholeWordsOnly,
      ignoreWhitespace: formState.ignoreWhitespace,
    };

    const types = formState.contentTypes;
    const xpath = formState.xpathRestriction.trim();

    if (types.length > 0 || xpath) {
      criteria.xmlFindOptions = {};
      if (types.length > 0) {
        criteria.xmlFindOptions.contentTypes = types;
      }
      if (xpath) {
        criteria.xmlFindOptions.xpathRestriction = xpath;
      }
    }

    return criteria;
  }

  /**
   * Create an Error object from API error response
   */
  private createErrorFromResponse(errorBody: Partial<FindError>): Error {
    const error = new Error(errorBody.message || 'Request failed');
    Object.assign(error, errorBody);
    return error;
  }

  /**
   * Type guard for FindEvent
   */
  private isFindEvent(value: unknown): value is FindEvent {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      'data' in value &&
      typeof (value as FindEvent).type === 'string'
    );
  }
}
