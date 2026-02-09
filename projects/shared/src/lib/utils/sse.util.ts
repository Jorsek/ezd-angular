import { Observable, Subscription } from 'rxjs';

export interface SSEEvent {
  event: string | null;
  data: unknown;
}

/**
 * Parses a Server-Sent Events stream from a fetch Response into an Observable.
 * Handles buffering across chunks and processes remaining data when stream ends.
 *
 * @param response - Fetch Response with SSE body
 * @param isComplete - Optional predicate to determine if stream should complete early
 */
export function fromSSEResponse(
  response: Response,
  isComplete?: (event: SSEEvent) => boolean,
): Observable<SSEEvent> {
  return new Observable((observer) => {
    const reader = response.body?.getReader();
    if (!reader) {
      observer.error(new Error('No response body'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent: string | null = null;
    let aborted = false;

    const processLines = (lines: string[]): boolean => {
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim();
          if (jsonStr) {
            try {
              const data = JSON.parse(jsonStr);
              const sseEvent: SSEEvent = { event: currentEvent, data };
              observer.next(sseEvent);
              if (isComplete?.(sseEvent)) {
                return true;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', jsonStr, e);
            }
          }
          currentEvent = null;
        }
      }
      return false;
    };

    const processStream = async (): Promise<void> => {
      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            processLines(buffer.split('\n'));
          }
          observer.complete();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        if (processLines(lines)) {
          await reader.cancel();
          observer.complete();
          return;
        }
      }
    };

    processStream().catch((err) => {
      if (!aborted) {
        observer.error(err);
      }
    });

    return () => {
      aborted = true;
      reader.cancel();
    };
  });
}

export interface FetchSSEOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  isComplete?: (event: SSEEvent) => boolean;
}

/**
 * Makes a fetch request and parses the SSE response.
 *
 * Error Handling:
 * - HTTP errors (4xx/5xx): Parses RFC 7807 JSON body if available, then emits via observer.error().
 *   The error object includes `status` (HTTP code) and `error` (parsed body with type/detail/xpath).
 * - Network errors: Emitted via observer.error() with the original fetch error.
 * - Abort (unsubscribe): Silently ignored, no error emitted.
 *
 * @param url - Endpoint URL
 * @param options - Request options (method, body, completion predicate)
 */
export function fetchSSE(url: string, options: FetchSSEOptions = {}): Observable<SSEEvent> {
  const { method = 'GET', body, isComplete } = options;

  return new Observable((observer) => {
    const abortController = new AbortController();
    let innerSubscription: Subscription | null = null;

    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          response
            .json()
            .catch(() => null)
            .then((errorBody: { type?: string; detail?: string; xpath?: string } | null) => {
              const error = new Error(errorBody?.detail || `HTTP ${response.status}`) as Error & {
                status?: number;
                error?: { type?: string; detail?: string; xpath?: string };
              };
              error.status = response.status;
              error.error = errorBody ?? undefined;
              observer.error(error);
            });
          return;
        }
        innerSubscription = fromSSEResponse(response, isComplete).subscribe(observer);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          observer.error(err);
        }
      });

    return () => {
      abortController.abort();
      innerSubscription?.unsubscribe();
    };
  });
}
