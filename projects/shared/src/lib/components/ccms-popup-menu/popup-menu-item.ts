import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { PopupMenuComponent } from './popup-menu';

/** Event payload emitted when a menu item is selected */
export interface PopupMenuItemSelectedEvent {
  /** The root popup menu containing this item */
  menu: PopupMenuComponent;
  /** The menu item that was selected */
  item: PopupMenuItemComponent;
}

/**
 * Menu item component for use inside a PopupMenuComponent.
 *
 * In single-select mode, emits (selected) and closes the menu.
 * In multi-select mode, toggles selection state without closing.
 *
 * @example Single-select:
 * ```html
 * <ccms-popup-menu-item (selected)="onEdit($event)">Edit</ccms-popup-menu-item>
 * ```
 *
 * @example Multi-select:
 * ```html
 * <ccms-popup-menu-item value="option1">Option 1</ccms-popup-menu-item>
 * ```
 */
@Component({
  selector: 'ccms-popup-menu-item',
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menuitem',
    tabindex: '0',
    '[class]': 'hostClasses()',
    '[attr.aria-checked]': 'isMultiSelect() ? isSelected() : null',
    '[attr.aria-disabled]': 'disabled()',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PopupMenuItemComponent {
  /** Value identifier for multi-select mode */
  value = input<string>('');

  /** Whether the item is disabled */
  disabled = input<boolean>(false);

  /** When true, this item represents "select all/clear" and is selected when menu selection is empty */
  selectAll = input<boolean>(false);

  /** Whether the item is in indeterminate state (partial selection for hierarchical items) */
  indeterminate = input<boolean>(false);

  /** When true, prevents the default toggle behavior on click (for custom selection handling) */
  preventDefaultToggle = input<boolean>(false);

  /** Emitted when item is selected */
  selected = output<PopupMenuItemSelectedEvent>();

  protected menu = inject(PopupMenuComponent);

  /** Whether this item is currently selected (multi-select mode) */
  protected isSelected = computed(() => {
    if (this.selectAll()) {
      // "All" option is selected when nothing else is selected
      return this.menu.isSelectionEmpty();
    }
    return this.menu.isValueSelected(this.value());
  });

  /** Whether the parent menu is in multi-select mode */
  protected isMultiSelect = computed(() => this.menu.multiSelect());

  /** Consolidated host classes */
  protected hostClasses = computed(() => {
    const classes: string[] = [];
    if (this.isMultiSelect()) classes.push('multi-select');
    if (this.isSelected()) classes.push('selected');
    if (this.indeterminate()) classes.push('indeterminate');
    if (this.disabled()) classes.push('disabled');
    return classes.join(' ');
  });

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();

    if (this.disabled()) {
      return;
    }

    this.selected.emit({ menu: this.menu, item: this });

    // selectAll items and items with custom toggle handling only emit the event
    if (this.selectAll() || this.preventDefaultToggle()) {
      return;
    }

    if (this.menu.multiSelect()) {
      this.menu.toggleValue(this.value());
    } else {
      // Single-select: set selection to this value and close
      const val = this.value();
      if (val) {
        this.menu.setSelection([val]);
      }
      this.menu.close();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onClick(event as unknown as MouseEvent);
    }
  }
}
