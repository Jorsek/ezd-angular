import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { FilterCategory } from '../../../models/filter.interface';
import {
  PopupMenuComponent,
  PopupMenuItemComponent,
  PopupMenuTriggerDirective,
  PopupSubmenuComponent,
} from '../../ccms-popup-menu';

/**
 * Add filter button component.
 *
 * Displays a "+ Add" button with a dropdown of available filter categories.
 * Base filters are shown at the top level, while metadata filters are
 * grouped in a "Metadata" submenu.
 *
 * When a category is selected, it emits the category so the parent can add
 * a new filter to the filter bar.
 *
 * @example
 * ```html
 * <ccms-add-filter-button
 *   [availableFilters]="availableFilters"
 *   (filterSelected)="onFilterSelected($event)" />
 * ```
 */
@Component({
  selector: 'ccms-add-filter-button',
  imports: [
    PopupMenuComponent,
    PopupMenuItemComponent,
    PopupMenuTriggerDirective,
    PopupSubmenuComponent,
  ],
  templateUrl: './add-filter-button.html',
  styleUrl: './add-filter-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AddFilterButtonComponent {
  /** Available filter categories that can be added */
  availableFilters = input.required<FilterCategory[]>();

  /** Emitted when a filter category is selected */
  filterSelected = output<FilterCategory>();

  /** Base filters (non-metadata) */
  protected baseFilters = computed(() => this.availableFilters().filter((f) => !f.metadata));

  /** Metadata filters (shown in submenu) */
  protected metadataFilters = computed(() => this.availableFilters().filter((f) => f.metadata));

  /** Whether the button should be disabled (no filters available) */
  protected isDisabled = computed(
    () => this.baseFilters().length === 0 && this.metadataFilters().length === 0,
  );

  /** Handle filter selection from popup menu */
  protected onItemSelected(filter: FilterCategory): void {
    this.filterSelected.emit(filter);
  }
}
