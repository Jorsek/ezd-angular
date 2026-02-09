import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  OnInit,
  OnDestroy,
  linkedSignal,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ViewFilter } from '../../insights-views';

/** Debounce delay for search input in milliseconds */
const SEARCH_INPUT_DEBOUNCE_MS = 400;

/**
 * Search filter with inline input field and search icon.
 * Used for free-text search across multiple fields.
 * Generates one ViewFilter per searchable field with search terms split by whitespace.
 */
@Component({
  selector: 'ccms-search-filter',
  imports: [],
  templateUrl: './search-filter.html',
  styleUrl: '../filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  private inputSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Inputs
  value = input<string>('');
  placeholder = input<string>('Search...');
  /** Whether to show clear button when there's a value */
  clearable = input<boolean>(true);
  /** Fields to generate search filters for */
  searchFields = input<string[]>([]);

  /** Internal value that syncs with input but can be updated locally */
  protected displayValue = linkedSignal(() => this.value());

  // Outputs
  /** @deprecated Use searchChanged instead */
  valueChange = output<string>();
  /** Emits search filters for each searchable field */
  searchChanged = output<ViewFilter[]>();

  ngOnInit(): void {
    // Debounce input changes
    this.inputSubject
      .pipe(debounceTime(SEARCH_INPUT_DEBOUNCE_MS), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.emitSearchFilters(value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.displayValue.set(input.value);
    this.inputSubject.next(input.value);
  }

  /**
   * Handle native search event (fires on Enter key or native clear button click).
   * This allows immediate search without waiting for debounce.
   */
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitSearchFilters(input.value);
  }

  protected onClear(): void {
    this.displayValue.set('');
    this.inputSubject.next('');
  }

  /** Parse input into words and emit ViewFilter for each searchable field */
  private emitSearchFilters(value: string): void {
    // Keep valueChange for backwards compatibility
    this.valueChange.emit(value);

    const words = value.trim().split(/\s+/).filter(Boolean);
    const fields = this.searchFields();

    if (words.length === 0 || fields.length === 0) {
      this.searchChanged.emit([]);
      return;
    }

    const filters: ViewFilter[] = fields.map((field) => ({
      field,
      search: words,
    }));

    this.searchChanged.emit(filters);
  }
}
