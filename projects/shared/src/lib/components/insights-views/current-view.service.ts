import { computed, Injectable, signal } from '@angular/core';
import {
  InsightsType,
  InsightsViewChart,
  InsightsViewColumn,
  ViewFilter,
  InsightsView,
  InsightsViewSort,
} from './insights-views.models';
import { Sort } from '../table/rich-table';

/** Deep equality check using JSON serialization */
function jsonEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Deep clones an InsightsView to ensure immutability.
 */
function cloneView(view: InsightsView): InsightsView {
  return {
    ...view,
    callouts: [...view.callouts],
    charts: view.charts.map((c) => ({ ...c })),
    columns: view.columns.map((c) => ({ ...c })),
    filters: view.filters.map((f) => ({ ...f })),
    sorts: view.sorts.map((s) => ({ ...s })),
  };
}

/**
 * Current View Service
 *
 * Manages the current view state for an insights page.
 * Provides reactive access to view parts (columns, filters, sorts, charts, callouts).
 *
 * This is a pure data container - persistence is handled by the parent component.
 *
 * Usage:
 * ```typescript
 * // In ViewSectionComponent
 * effect(() => {
 *   const views = this.views();
 *   const type = this.insightType();
 *   if (views.length > 0) {
 *     this.currentViewService.configure(type, views);
 *   }
 * });
 * ```
 */
// Service is intentionally not providedIn: 'root' - it's meant to be provided
// at component level for hierarchical scoping (each parent gets its own instance)
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class CurrentViewService {
  private _insightType = signal<InsightsType | null>(null);
  private _allViews = signal<InsightsView[]>([]);
  private readonly _view = signal<InsightsView | null>(null);
  private readonly _dirty = signal(false);

  /**
   * Whether the service has been configured with views.
   */
  readonly initialized = computed(() => this._allViews().length > 0);

  /**
   * Whether a current view has been set via setView().
   * Use this to gate data fetches that depend on filters/sorts/charts.
   */
  readonly viewReady = computed(() => this._view() !== null);

  /**
   * The insight type this service was configured with.
   */
  readonly insightType = computed(() => {
    const type = this._insightType();
    if (!type) {
      throw new Error('CurrentViewService not configured. Call configure() first.');
    }
    return type;
  });

  /**
   * The default view (first view in the sorted list, typically readOnly).
   */
  readonly defaultView = computed(() => {
    const views = this._allViews();
    if (views.length === 0) {
      throw new Error('CurrentViewService not configured. Call configure() first.');
    }
    return views[0];
  });

  /**
   * All available views.
   */
  readonly allViews = computed(() => this._allViews());

  /**
   * The current view. Always returns a valid view after configuration.
   */
  readonly view = computed(() => {
    const v = this._view();
    if (!v) {
      throw new Error('CurrentViewService not configured. Call configure() first.');
    }
    return v;
  });

  /**
   * Whether the current view has been modified since last save or reset.
   */
  readonly dirty = computed(() => this._dirty());

  /**
   * Current columns configuration.
   * Uses deep equality to prevent spurious notifications when other view parts change.
   */
  readonly columns = computed(() => this._view()?.columns ?? [], { equal: jsonEqual });

  /**
   * Current filters with values. Excludes empty entries (field-only declarations).
   * Uses deep equality to prevent spurious notifications when other view parts change.
   */
  readonly filters = computed(
    () =>
      (this._view()?.filters ?? []).filter(
        (f) => !!(f.list?.length || f.value || f.range || f.interval || f.search?.length),
      ),
    { equal: jsonEqual },
  );

  /**
   * Current sorts configuration.
   * Uses deep equality to prevent spurious notifications when other view parts change.
   */
  readonly sorts = computed(() => this._view()?.sorts ?? [], { equal: jsonEqual });

  /**
   * Current charts configuration.
   * Uses deep equality to prevent spurious notifications when other view parts change.
   */
  readonly charts = computed(() => this._view()?.charts ?? [], { equal: jsonEqual });

  /**
   * Current callouts configuration.
   * Uses deep equality to prevent spurious notifications when other view parts change.
   */
  readonly callouts = computed(() => this._view()?.callouts ?? [], { equal: jsonEqual });

  /**
   * Configure the service with an insight type and list of views.
   * Does NOT set the current view - caller is responsible for calling setView().
   *
   * @param type The insight type (CONTENT, LOCALIZATION, etc.)
   * @param views The sorted list of views (first one is the default)
   */
  configure(type: InsightsType, views: InsightsView[]): void {
    if (views.length === 0) {
      return;
    }

    console.log('[Views] configure called', { type, viewCount: views.length });

    this._insightType.set(type);
    this._allViews.set(views);
  }

  /**
   * Set the entire current view.
   * Typically called when loading a different saved view.
   *
   * @param view The view to set as current
   */
  setView(view: InsightsView): void {
    console.log('[Views] setView called:', view.name, view.id);
    this._view.set(cloneView(view));
    this._dirty.set(false);
  }

  /**
   * After a successful save/update, adopt the server-assigned ID and metadata
   * without replacing the local view state (filters, columns, etc.).
   */
  markSaved(savedView: InsightsView): void {
    const current = this._view();
    if (!current) return;
    this._view.set({
      ...current,
      id: savedView.id,
      insightType: savedView.insightType,
      name: savedView.name,
      description: savedView.description,
      shared: savedView.shared,
    });
    this._dirty.set(false);
  }

  /**
   * Update the columns configuration.
   */
  setColumns(columns: InsightsViewColumn[]): void {
    this.updateView({ columns: columns.map((c) => ({ ...c })) });
  }

  /**
   * Update the filters configuration.
   */
  setFilters(filters: ViewFilter[]): void {
    this.updateView({ filters: filters.map((f) => ({ ...f })) });
  }

  /**
   * Update the sorts configuration.
   */
  setSorts(sorts: InsightsViewSort[]): void {
    this.updateView({ sorts: sorts.map((s) => ({ ...s })) });
  }

  setSortsFromTableSort(sort: Sort): void {
    if (sort.column) {
      this.setSorts([
        {
          field: sort.column,
          ascending: sort.direction === 'asc',
        },
      ]);
    } else {
      this.setSorts([]);
    }
  }

  /**
   * Update the charts configuration.
   */
  setCharts(charts: InsightsViewChart[]): void {
    this.updateView({ charts: charts.map((c) => ({ ...c })) });
  }

  /**
   * Update the callouts configuration.
   */
  setCallouts(callouts: string[]): void {
    this.updateView({ callouts: [...callouts] });
  }

  /**
   * Reset the current view to the default view (first in the list).
   */
  reset(): void {
    const views = this._allViews();
    if (views.length > 0) {
      this._view.set(cloneView(views[0]));
      this._dirty.set(false);
    }
  }

  private updateView(partial: Partial<InsightsView>): void {
    const current = this._view();
    if (!current) {
      console.warn('Current view not set. Cannot update.');
      return;
    }

    this._view.set({ ...current, ...partial });
    this._dirty.set(true);
  }
}
