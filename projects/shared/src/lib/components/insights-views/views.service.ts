import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { InsightsType, InsightsViewRequest, InsightsView } from './insights-views.models';

/**
 * Views Service
 *
 * Manages saved views for the insights feature.
 * Caches views per InsightsType using BehaviorSubjects.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewsService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/ezdnxtgen/api/turbo/proxy/insights/views';
  private cache = new Map<InsightsType, BehaviorSubject<InsightsView[]>>();

  /**
   * Get views for a given type.
   * First call fetches from API and caches, subsequent calls return cached observable.
   */
  get(viewType: InsightsType): Observable<InsightsView[]> {
    if (this.cache.has(viewType)) {
      return this.cache.get(viewType)!.asObservable();
    }

    return this.http.get<InsightsView[]>(`${this.baseUrl}/${viewType.toLowerCase()}`).pipe(
      tap((views) => {
        const subject = new BehaviorSubject<InsightsView[]>(views);
        this.cache.set(viewType, subject);
      }),
    );
  }

  /**
   * Force refresh views from API, bypassing cache.
   * Updates cache on success, errors propagate to caller.
   */
  refresh(viewType: InsightsType): Observable<InsightsView[]> {
    let subject = this.cache.get(viewType);
    if (!subject) {
      subject = new BehaviorSubject<InsightsView[]>([]);
      this.cache.set(viewType, subject);
    }

    return this.http
      .get<InsightsView[]>(`${this.baseUrl}/${viewType.toLowerCase()}`)
      .pipe(tap((views) => subject.next(views)));
  }

  /**
   * Create a new view.
   */
  add(viewType: InsightsType, view: Omit<InsightsViewRequest, 'id'>): Observable<InsightsView> {
    return this.http.post<InsightsView>(`${this.baseUrl}/${viewType.toLowerCase()}`, view).pipe(
      tap((created) => {
        const subject = this.cache.get(viewType);
        if (subject) {
          subject.next([...subject.value, created]);
        }
      }),
    );
  }

  /**
   * Update an existing view.
   */
  update(viewType: InsightsType, view: InsightsViewRequest): Observable<InsightsView> {
    return this.http
      .put<InsightsView>(`${this.baseUrl}/${viewType.toLowerCase()}/${view.id}`, view)
      .pipe(
        tap((updated) => {
          const subject = this.cache.get(viewType);
          if (subject) {
            const views = subject.value;
            const index = views.findIndex((v) => v.id === updated.id);
            if (index >= 0) {
              const newList = [...views];
              newList[index] = updated;
              subject.next(newList);
            }
          }
        }),
      );
  }

  /**
   * Delete a view by ID.
   */
  remove(viewType: InsightsType, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${viewType.toLowerCase()}/${id}`).pipe(
      tap(() => {
        const subject = this.cache.get(viewType);
        if (subject) {
          subject.next(subject.value.filter((v) => v.id !== id));
        }
      }),
    );
  }

  /**
   * Save a view ID to session storage for the given insight type.
   */
  saveLastViewId(viewType: InsightsType, viewId: string): void {
    const key = this.getSessionStorageKey(viewType);
    console.log('[Views] Saving last view ID to session storage:', { key, viewId });
    sessionStorage.setItem(key, viewId);
  }

  /**
   * Get the last selected view ID from session storage.
   * Returns null if no view was saved.
   */
  getLastViewId(viewType: InsightsType): string | null {
    const key = this.getSessionStorageKey(viewType);
    const viewId = sessionStorage.getItem(key);
    console.log('[Views] Getting last view ID from session storage:', { key, viewId });
    return viewId;
  }

  private getSessionStorageKey(viewType: InsightsType): string {
    return `insights-${viewType.toLowerCase()}-last-view-id`;
  }
}
