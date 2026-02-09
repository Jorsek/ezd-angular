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

/** Flattened option with depth and descendant information for hierarchical rendering */
interface FlatOption {
  option: FilterOption;
  depth: number;
  descendantValues: string[];
}
import {
  PopupMenuComponent,
  PopupMenuItemComponent,
  PopupMenuTriggerDirective,
  PopupMenuItemSelectedEvent,
} from '../../ccms-popup-menu';
import { FilterComponent } from '../filter/filter';

/**
 * Taxonomy filter with hierarchical options.
 * Options with children render as group headers with child items beneath.
 */
@Component({
  selector: 'ccms-taxonomy-filter',
  imports: [FilterComponent, PopupMenuComponent, PopupMenuItemComponent, PopupMenuTriggerDirective],
  templateUrl: './taxonomy-filter.html',
  styleUrl: '../filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TaxonomyFilterComponent {
  /** Minimum number of leaf options to show search box. Set to 0 to always show. */
  private static readonly DEFAULT_SEARCH_THRESHOLD = 7;
  /** Maximum nesting depth for hierarchical options */
  private static readonly MAX_DEPTH = 5;

  // Inputs
  label = input.required<string>();
  /** Options can be an Observable or a plain array */
  options = input<Observable<FilterOption[]> | FilterOption[]>([]);
  selectedValues = input<string[]>([]);
  /** When true, search is always shown. When false, search is never shown. When undefined, uses threshold. */
  searchable = input<boolean | undefined>(undefined);
  searchThreshold = input<number>(TaxonomyFilterComponent.DEFAULT_SEARCH_THRESHOLD);
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

  // Flatten options for label lookup (includes children)
  private flatOptions = computed(() => {
    const result: FilterOption[] = [];
    const flatten = (opts: FilterOption[]) => {
      for (const opt of opts) {
        result.push(opt);
        if (opt.children) flatten(opt.children);
      }
    };
    flatten(this.optionsSignal());
    return result;
  });

  protected displayValue = computed(() => {
    const selected = this.selectedValues();
    const options = this.flatOptions();

    if (selected.length === 0) return 'All';
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
    // Count only selectable options (leaves in the hierarchy)
    return this.flatOptions().length >= this.searchThreshold();
  });

  /** Map of option value to all its descendants (from unfiltered options) */
  private allDescendantsMap = computed(() => {
    const map = new Map<string, string[]>();

    const getDescendantValues = (opt: FilterOption): string[] => {
      const values: string[] = [];
      if (opt.children) {
        for (const child of opt.children) {
          values.push(child.value);
          values.push(...getDescendantValues(child));
        }
      }
      return values;
    };

    const buildMap = (options: FilterOption[]) => {
      for (const opt of options) {
        map.set(opt.value, getDescendantValues(opt));
        if (opt.children) {
          buildMap(opt.children);
        }
      }
    };

    buildMap(this.optionsSignal());
    return map;
  });

  /** Flattened options with depth and descendant information for hierarchical rendering */
  protected flattenedOptions = computed(() => {
    const result: FlatOption[] = [];
    const descendantsMap = this.allDescendantsMap();

    const flatten = (options: FilterOption[], depth: number) => {
      for (const opt of options) {
        result.push({
          option: opt,
          depth,
          // Use full descendants from unfiltered options, not just visible ones
          descendantValues: descendantsMap.get(opt.value) ?? [],
        });
        if (opt.children?.length && depth < TaxonomyFilterComponent.MAX_DEPTH) {
          flatten(opt.children, depth + 1);
        }
      }
    };

    flatten(this.filterOptions(this.optionsSignal()), 0);
    return result;
  });

  /** Check if a flattened option has children */
  protected hasChildren(item: FlatOption): boolean {
    return item.descendantValues.length > 0;
  }

  /** Get selection state for hierarchical items: 'all', 'some', or 'none' */
  protected getSelectionState(item: FlatOption): 'all' | 'some' | 'none' {
    const selected = this.selectedValues();
    const selfSelected = selected.includes(item.option.value);
    const descendantCount = item.descendantValues.length;
    const selectedDescendants = item.descendantValues.filter((v) => selected.includes(v)).length;

    // All = self + all descendants selected
    if (selfSelected && selectedDescendants === descendantCount) return 'all';
    // Some = partial selection (self or any descendants, but not all)
    if (selfSelected || selectedDescendants > 0) return 'some';
    // None = nothing in this branch selected
    return 'none';
  }

  /** Handle parent click with cascade selection */
  protected onParentClick(item: FlatOption): void {
    const state = this.getSelectionState(item);
    const current = this.selectedValues();
    const allValues = [item.option.value, ...item.descendantValues];

    if (state === 'all') {
      // Deselect entire branch
      const newSelection = current.filter((v) => !allValues.includes(v));
      this.selectionChange.emit(newSelection);
    } else {
      // Select entire branch (fills in missing values)
      const newSelection = [...new Set([...current, ...allValues])];
      this.selectionChange.emit(newSelection);
    }
  }

  protected filterOptions(options: FilterOption[]): FilterOption[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return options;

    // Filter including children - keep parent if any child matches
    return options
      .filter((opt) => {
        if (opt.label.toLowerCase().includes(query)) return true;
        if (opt.children?.some((child) => child.label.toLowerCase().includes(query))) return true;
        return false;
      })
      .map((opt) => {
        if (!opt.children) return opt;
        // Filter children too
        const filteredChildren = opt.children.filter((child) =>
          child.label.toLowerCase().includes(query),
        );
        // If parent matches, show all children; otherwise show filtered
        if (opt.label.toLowerCase().includes(query)) return opt;
        return { ...opt, children: filteredChildren };
      });
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
