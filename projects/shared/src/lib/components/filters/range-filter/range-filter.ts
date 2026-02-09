import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  inject,
  DestroyRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterComponent } from '../filter/filter';
import { ViewFilter } from '../../insights-views';

/** Debounce delay for range input in milliseconds */
const RANGE_INPUT_DEBOUNCE_MS = 400;

/** Range value for numeric filters */
export interface RangeValue {
  min?: number;
  max?: number;
}

/** Interval value for date filters */
export interface IntervalValue {
  start?: string;
  end?: string;
}

/**
 * Range filter with two inline inputs (min/max for numbers, start/end for dates).
 * The `type` input determines whether to render number or date inputs.
 * Emits a partial ViewFilter with either `range` or `interval` set.
 */
@Component({
  selector: 'ccms-range-filter',
  imports: [FilterComponent],
  templateUrl: './range-filter.html',
  styleUrl: '../filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RangeFilterComponent {
  private destroyRef = inject(DestroyRef);
  private inputSubject = new Subject<void>();

  /** Filter label */
  label = input.required<string>();

  /** Filter type: 'number' renders number inputs, 'date' renders date inputs */
  type = input<'number' | 'date'>('number');

  /** Current range value (used when type is 'number') */
  range = input<RangeValue>({});

  /** Current interval value (used when type is 'date') */
  interval = input<IntervalValue>({});

  /** Whether the filter can be removed */
  removable = input<boolean>(true);

  /** Emits a partial ViewFilter with range or interval depending on type */
  valueChange = output<Pick<ViewFilter, 'range' | 'interval'>>();

  /** Emitted when remove button is clicked */
  removed = output<void>();

  // Pending values use null = "explicitly cleared", undefined = "not touched"
  private pendingMin: number | null | undefined = undefined;
  private pendingMax: number | null | undefined = undefined;
  private pendingStart: string | null | undefined = undefined;
  private pendingEnd: string | null | undefined = undefined;

  constructor() {
    this.inputSubject
      .pipe(debounceTime(RANGE_INPUT_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitValue());
  }

  protected onMinInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pendingMin = value ? Number(value) : null;
    this.inputSubject.next();
  }

  protected onMaxInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pendingMax = value ? Number(value) : null;
    this.inputSubject.next();
  }

  protected onStartInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pendingStart = value || null;
    this.inputSubject.next();
  }

  protected onEndInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pendingEnd = value || null;
    this.inputSubject.next();
  }

  private emitValue(): void {
    if (this.type() === 'number') {
      const min = this.resolvePending(this.pendingMin, this.range().min);
      const max = this.resolvePending(this.pendingMax, this.range().max);
      this.valueChange.emit({ range: { min, max } });
    } else {
      const start = this.resolvePending(this.pendingStart, this.interval().start);
      const end = this.resolvePending(this.pendingEnd, this.interval().end);
      this.valueChange.emit({ interval: { start, end } });
    }
  }

  /** Resolve pending value: undefined = use input, null = cleared, value = use value */
  private resolvePending<T>(
    pending: T | null | undefined,
    inputValue: T | undefined,
  ): T | undefined {
    if (pending === undefined) return inputValue;
    if (pending === null) return undefined;
    return pending;
  }
}
