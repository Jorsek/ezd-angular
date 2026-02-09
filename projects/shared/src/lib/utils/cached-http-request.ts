import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { retry, shareReplay, startWith, switchMap } from 'rxjs/operators';

/** Options for CachedHttpRequest (subset of HttpClient options that return JSON) */
export interface CachedHttpRequestOptions {
  /** Request body - can be a static object or a factory function for dynamic bodies */
  body?: unknown | (() => unknown);
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | string[]>;
  context?: HttpContext;
  withCredentials?: boolean;
}

/**
 * A reusable wrapper for HTTP requests that caches the result with shareReplay.
 * Supports manual refresh to re-fetch data.
 *
 * @example
 * ```typescript
 * private request = new CachedHttpRequest<User[]>(http, 'GET', '/api/users');
 *
 * getUsers(): Observable<User[]> {
 *   return this.request.get();
 * }
 *
 * refreshUsers(): void {
 *   this.request.refresh();
 * }
 * ```
 */
export class CachedHttpRequest<T> {
  private trigger$ = new Subject<void>();
  private data$: Observable<T>;

  constructor(
    private http: HttpClient,
    private method: string,
    private url: string,
    private options?: CachedHttpRequestOptions,
  ) {
    this.data$ = this.trigger$.pipe(
      startWith(undefined),
      switchMap(() => {
        // Resolve body if it's a factory function
        const body =
          typeof this.options?.body === 'function' ? this.options.body() : this.options?.body;

        return this.http
          .request<T>(this.method, this.url, {
            ...this.options,
            body,
            observe: 'body' as const,
            responseType: 'json' as const,
          })
          .pipe(retry(3));
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /** Returns shared observable - triggers fetch if not cached */
  get(): Observable<T> {
    return this.data$;
  }

  /** Triggers a new fetch, all subscribers receive the new value */
  refresh(): void {
    this.trigger$.next();
  }

  /** Triggers refresh and returns the observable for re-subscribing */
  retry(): Observable<T> {
    this.trigger$.next();
    return this.data$;
  }
}
