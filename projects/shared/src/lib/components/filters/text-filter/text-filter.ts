import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FilterComponent } from '../filter/filter';

/** Debounce delay for text input in milliseconds */
const TEXT_INPUT_DEBOUNCE_MS = 400;

/**
 * Text filter with inline input field.
 * Input is inline (not in a dropdown) and fires with debounce delay.
 */
@Component({
  selector: 'ccms-text-filter',
  imports: [FilterComponent],
  templateUrl: './text-filter.html',
  styleUrl: '../filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TextFilterComponent implements OnInit, OnDestroy {
  private inputSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Inputs
  label = input.required<string>();
  value = input<string>('');
  placeholder = input<string>('Enter value...');
  removable = input<boolean>(true);

  // Outputs
  valueChange = output<string>();
  removed = output<void>();

  ngOnInit(): void {
    // Debounce input changes
    this.inputSubject
      .pipe(debounceTime(TEXT_INPUT_DEBOUNCE_MS), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.valueChange.emit(value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputSubject.next(input.value);
  }
}
