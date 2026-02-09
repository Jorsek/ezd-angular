import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, isObservable } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { FilterOption } from '../../../models/filter.interface';
import {
  PopupMenuComponent,
  PopupMenuItemComponent,
  PopupMenuTriggerDirective,
  PopupMenuItemSelectedEvent,
} from '../../ccms-popup-menu';
import { FilterComponent } from '../filter/filter';

/**
 * List filter with flat options and optional search.
 * Displays a dropdown with checkbox multi-select.
 */
@Component({
  selector: 'ccms-list-filter',
  imports: [FilterComponent, PopupMenuComponent, PopupMenuItemComponent, PopupMenuTriggerDirective],
  templateUrl: './list-filter.html',
  styleUrl: '../filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ListFilterComponent {
  /** Minimum number of options to show search box. Set to 0 to always show. */
  private static readonly DEFAULT_SEARCH_THRESHOLD = 7;

  // Inputs
  label = input.required<string>();
  /** Options can be an Observable or a plain array */
  options = input<Observable<FilterOption[]> | FilterOption[]>([]);
  selectedValues = input<string[]>([]);
  /** Selection mode: 'multi' for checkboxes, 'single' for radio-style selection */
  selectionMode = input<'single' | 'multi'>('multi');
  /** When true, search is always shown. When false, search is never shown. When undefined, uses threshold. */
  searchable = input<boolean | undefined>(undefined);
  searchThreshold = input<number>(ListFilterComponent.DEFAULT_SEARCH_THRESHOLD);
  removable = input<boolean>(true);

  // Outputs
  selectionChange = output<string[]>();
  removed = output<void>();

  // Internal state
  private searchQuery = signal('');

  /** Result type for options loading */
  private optionsResult$ = computed(() => {
    const opts = this.options();
    const source$ = isObservable(opts) ? opts : of(opts);
    return source$.pipe(
      map((options) => ({ options, error: false })),
      catchError(() => of({ options: [] as FilterOption[], error: true })),
    );
  });

  // Convert to signal for computed values (includes error state)
  private optionsResultSignal = toSignal(
    toObservable(this.optionsResult$).pipe(switchMap((obs) => obs)),
    { initialValue: { options: [], error: false } },
  );

  /** Options signal derived from result */
  protected optionsSignal = computed(() => this.optionsResultSignal().options);

  /** Whether options failed to load */
  protected hasOptionsError = computed(() => this.optionsResultSignal().error);

  protected displayValue = computed(() => {
    const selected = this.selectedValues();
    const options = this.optionsSignal();
    const isSingle = this.selectionMode() === 'single';

    if (selected.length === 0) return isSingle ? 'Select' : 'All';
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label ?? selected[0];
    }
    return `${selected.length} selected`;
  });

  /** Whether to show the search box based on searchable input and option count */
  protected showSearch = computed(() => {
    const searchable = this.searchable();
    // If explicitly set, use that value
    if (searchable !== undefined) return searchable;
    // Otherwise, show search only when options exceed threshold
    return this.optionsSignal().length >= this.searchThreshold();
  });

  protected filterOptions(options: FilterOption[]): FilterOption[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  /** Handle "All" selection - clears selection and closes menu */
  protected onSelectAll(event: PopupMenuItemSelectedEvent): void {
    event.menu.clearSelection();
    event.menu.close();
  }

  protected onSelectionChange(values: string[]): void {
    this.selectionChange.emit(values);
  }
}
