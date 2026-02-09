import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Filter actions component with Clear button.
 * Filters are now auto-applied on change.
 *
 * @example
 * ```html
 * <ccms-filter-actions
 *   [hasFilters]="true"
 *   (clearClick)="onClear()" />
 * ```
 */
@Component({
  selector: 'ccms-filter-actions',
  imports: [],
  templateUrl: './filter-actions.html',
  styleUrl: './filter-actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterActionsComponent {
  /** Whether any filters are active (enables Clear button) */
  hasFilters = input<boolean>(false);

  /** Emitted when Clear button is clicked */
  clearClick = output<void>();

  /** Handle Clear button click */
  protected onClear(): void {
    this.clearClick.emit();
  }

  /** Handle keyboard for Clear */
  protected onClearKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onClear();
    }
  }
}
