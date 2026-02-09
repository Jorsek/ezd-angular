import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

/**
 * Base filter chip component.
 * Provides the chip wrapper with label, content slot, optional expander, and remove button.
 *
 * @example Dropdown filter (with expander)
 * ```html
 * <ccms-filter
 *   [label]="'Status'"
 *   [expandable]="true"
 *   [removable]="true"
 *   [ccmsPopupMenuTrigger]="menu">
 *   <span class="filter-value">Active</span>
 *   <ccms-popup-menu #menu>...</ccms-popup-menu>
 * </ccms-filter>
 * ```
 *
 * @example Inline text filter
 * ```html
 * <ccms-filter [label]="'Author'" [removable]="true">
 *   <input type="text" class="filter-input" />
 * </ccms-filter>
 * ```
 */
@Component({
  selector: 'ccms-filter',
  templateUrl: './filter.html',
  styleUrl: '../filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FilterComponent {
  /** Filter label */
  label = input.required<string>();

  /** Whether to show the expander chevron (for dropdown filters) */
  expandable = input<boolean>(false);

  /** Whether the filter can be removed */
  removable = input<boolean>(true);

  /** Emitted when remove button clicked */
  removed = output<void>();

  protected onRemoveClick(event: Event): void {
    event.stopPropagation(); // Prevent triggering popup menu
    this.removed.emit();
  }
}
