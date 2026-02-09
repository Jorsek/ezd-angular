import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  output,
  input,
  inject,
  DestroyRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterCategory, ActiveFilter } from '../../../models/filter.interface';
import { ViewFilter } from '../../insights-views';
import { FilterActionsComponent } from '../filter-actions/filter-actions';
import { AddFilterButtonComponent } from '../add-filter-button/add-filter-button';
import { ListFilterComponent } from '../../filters/list-filter/list-filter';
import { TaxonomyFilterComponent } from '../../filters/taxonomy-filter/taxonomy-filter';
import { TextFilterComponent } from '../../filters/text-filter/text-filter';
import { SearchFilterComponent } from '../../filters/search-filter/search-filter';
import { RangeFilterComponent } from '../../filters/range-filter/range-filter';
export const FILTER_DEBOUNCE_MS = 300;

@Component({
  selector: 'ccms-filter-section',
  imports: [
    FilterActionsComponent,
    AddFilterButtonComponent,
    ListFilterComponent,
    TaxonomyFilterComponent,
    TextFilterComponent,
    SearchFilterComponent,
    RangeFilterComponent,
  ],
  templateUrl: './filter-section.html',
  styleUrl: './filter-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSectionComponent {
  private destroyRef = inject(DestroyRef);

  /** Subject to trigger debounced filter emission */
  private filterChange$ = new Subject<void>();

  /** All available filter definitions */
  allFilters = input.required<FilterCategory[]>();

  /** Current active filter values from the view model */
  activeFilters = input<ViewFilter[]>([]);

  hideAddFilterButton = input<boolean>(false);

  /** Field IDs that are searchable (passed to search filter) */
  searchFields = input<string[]>([]);

  /** Emitted when filter selections change (after debounce) */
  filtersChanged = output<ViewFilter[]>();

  /** Whether to show the search filter (auto-added when searchFields provided) */
  protected showSearchFilter = computed(() => this.searchFields().length > 0);

  /** Current search value from active filters (for display in search input) */
  protected searchValue = computed(() => {
    // Find the first search filter in activeFilters to get the current search terms
    const searchFilter = this.activeFilters().find((f) => f.search);
    return searchFilter?.search?.join(' ') ?? '';
  });

  /** IDs of non-default filters the user has explicitly added */
  private addedFilterIds = signal<Set<string>>(new Set());

  /** Pending selections buffered during the debounce window */
  private pendingSelections = signal<Record<string, ViewFilter>>({});

  /** Pending search filters (multiple entries, one per searchable field) */
  private pendingSearchFilters = signal<ViewFilter[]>([]);

  /** Whether search has been modified (to distinguish empty from unchanged) */
  private searchDirty = signal(false);

  /** Filters excluding search type (search is auto-added when searchFields provided) */
  private nonSearchFilters = computed(() => this.allFilters().filter((f) => f.type !== 'search'));

  /** IDs of default filters (excluding search) */
  private defaultFilterIds = computed(() =>
    this.nonSearchFilters()
      .filter((f) => f.default)
      .map((f) => f.id),
  );

  /** Default filter categories (excluding search) */
  private defaultFilters = computed(() =>
    this.nonSearchFilters().filter((f) => this.defaultFilterIds().includes(f.id)),
  );

  /** Non-default filter categories available via "+ Add" (excluding search) */
  protected availableFilters = computed(() =>
    this.nonSearchFilters().filter((f) => !this.defaultFilterIds().includes(f.id)),
  );

  /** Display filters computed from definitions + input state + pending state (excludes search) */
  protected displayFilters = computed<ActiveFilter[]>(() => {
    const inputFilters = this.activeFilters();
    const pending = this.pendingSelections();
    const addedIds = this.addedFilterIds();
    const allFilterDefs = this.nonSearchFilters();

    // Build a lookup from field → ViewFilter for the input state
    const inputLookup = new Map<string, ViewFilter>();
    for (const vf of inputFilters) {
      inputLookup.set(vf.field, vf);
    }

    // Non-default filter IDs to show: from input state OR user-added
    const nonDefaultIdsToShow = new Set<string>([
      ...addedIds,
      ...inputFilters.map((vf) => vf.field).filter((id) => !this.defaultFilterIds().includes(id)),
    ]);

    // Build active filters: defaults first, then additional
    const defaultActives: ActiveFilter[] = this.defaultFilters().map((category) =>
      this.buildActiveFilter(category, pending[category.id] ?? inputLookup.get(category.id)),
    );

    const additionalActives: ActiveFilter[] = [...nonDefaultIdsToShow]
      .map((id) => {
        const category = allFilterDefs.find((f) => f.id === id);
        if (!category) return null;
        return this.buildActiveFilter(category, pending[id] ?? inputLookup.get(id));
      })
      .filter((f): f is ActiveFilter => f !== null);

    return [...defaultActives, ...additionalActives];
  });

  /** Check if any filter has selections (including search) */
  protected hasFilters = computed(() => {
    // Check search value
    if (this.searchValue().length > 0) return true;
    // Check other filters
    return this.displayFilters().some(
      (f) =>
        f.selectedValues.length > 0 ||
        f.range?.min !== undefined ||
        f.range?.max !== undefined ||
        f.interval?.start !== undefined ||
        f.interval?.end !== undefined,
    );
  });

  /** Filters not yet added by the user */
  protected remainingFilters = computed(() => {
    const activeIds = new Set(this.displayFilters().map((f) => f.category.id));
    return this.availableFilters().filter((f) => !activeIds.has(f.id));
  });

  constructor() {
    this.filterChange$
      .pipe(debounceTime(FILTER_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitFilterState());
  }

  /** Handle list/taxonomy selection change */
  protected onSelectionChange(filterId: string, values: string[]): void {
    this.pendingSelections.update((p) => ({
      ...p,
      [filterId]: { field: filterId, list: values },
    }));
    this.filterChange$.next();
  }

  /** Handle text filter value change */
  protected onTextValueChange(filterId: string, value: string): void {
    this.pendingSelections.update((p) => ({
      ...p,
      [filterId]: { field: filterId, value },
    }));
    this.filterChange$.next();
  }

  /** Handle search filter change (multiple ViewFilters, one per searchable field) */
  protected onSearchChange(filters: ViewFilter[]): void {
    this.pendingSearchFilters.set(filters);
    this.searchDirty.set(true);
    this.filterChange$.next();
  }

  /** Handle range/date filter value change */
  protected onRangeValueChange(
    filterId: string,
    value: Pick<ViewFilter, 'range' | 'interval'>,
  ): void {
    this.pendingSelections.update((p) => ({
      ...p,
      [filterId]: { field: filterId, ...value },
    }));
    this.filterChange$.next();
  }

  /** Handle adding a new filter via "+ Add" */
  protected onFilterAdded(category: FilterCategory): void {
    this.addedFilterIds.update((ids) => {
      const next = new Set(ids);
      next.add(category.id);
      return next;
    });
  }

  /** Handle removing a filter */
  protected onFilterRemoved(filterId: string): void {
    this.addedFilterIds.update((ids) => {
      const next = new Set(ids);
      next.delete(filterId);
      return next;
    });
    // Set an empty marker so emitFilterState proceeds and removes this filter
    this.pendingSelections.update((p) => ({
      ...p,
      [filterId]: { field: filterId },
    }));
    this.filterChange$.next();
  }

  /** Handle Clear button click — emits immediately */
  protected onClear(): void {
    this.addedFilterIds.set(new Set());
    this.pendingSelections.set({});
    this.pendingSearchFilters.set([]);
    this.searchDirty.set(false);
    this.filtersChanged.emit([]);
  }

  /** Get the first selected value for text/search filters */
  protected getFirstValue(values: string[]): string {
    return values[0] ?? '';
  }

  /** Build and emit the merged filter state */
  private emitFilterState(): void {
    const pending = this.pendingSelections();
    const pendingSearch = this.pendingSearchFilters();
    const searchChanged = this.searchDirty();

    // Nothing to emit if no pending changes
    if (Object.keys(pending).length === 0 && !searchChanged) return;

    // Start from input state (excluding search filters which are handled separately)
    const inputFilters = this.activeFilters();
    const searchFieldIds = new Set(this.searchFields());
    const merged = new Map<string, ViewFilter>();
    for (const vf of inputFilters) {
      // Skip search filters from input - they'll be replaced by pendingSearch
      if (!searchFieldIds.has(vf.field) || !vf.search) {
        merged.set(vf.field, vf);
      }
    }

    // Layer pending selections on top
    for (const [id, vf] of Object.entries(pending)) {
      if (this.isEmptyFilter(vf)) {
        merged.delete(id);
      } else {
        merged.set(id, vf);
      }
    }

    // Only include filters that are displayed AND have values
    const activeIds = new Set(this.displayFilters().map((f) => f.category.id));
    const result: ViewFilter[] = [];
    for (const [id, vf] of merged) {
      if (activeIds.has(id) && !this.isEmptyFilter(vf)) {
        result.push(vf);
      }
    }

    // Add search filters (these are separate from the display filters)
    for (const sf of pendingSearch) {
      result.push(sf);
    }

    this.filtersChanged.emit(result);
    this.pendingSelections.set({});
    this.searchDirty.set(false);
  }

  /** Extract string[] values from a ViewFilter for display */
  private extractValues(vf: ViewFilter | undefined): string[] {
    if (!vf) return [];
    if (vf.list) return vf.list;
    if (vf.value) return [vf.value];
    return [];
  }

  /** Check if a ViewFilter has no meaningful value */
  private isEmptyFilter(vf: ViewFilter): boolean {
    if (vf.list && vf.list.length === 0) return true;
    if (vf.value !== undefined && vf.value === '') return true;
    if (vf.range && vf.range.min === undefined && vf.range.max === undefined) return true;
    if (vf.interval && !vf.interval.start && !vf.interval.end) return true;
    if (vf.search && vf.search.length === 0) return true;
    if (!vf.list && !vf.value && !vf.range && !vf.interval && !vf.search) return true;
    return false;
  }

  /** Build an ActiveFilter from a category and its ViewFilter state */
  private buildActiveFilter(category: FilterCategory, vf: ViewFilter | undefined): ActiveFilter {
    return {
      category,
      selectedValues: this.extractValues(vf),
      range: vf?.range,
      interval: vf?.interval,
    };
  }
}
