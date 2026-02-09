import { Directive, ElementRef, inject, input } from '@angular/core';
import { PopupMenuComponent } from './popup-menu';

/**
 * Directive to attach a popup menu trigger to any element.
 *
 * @example
 * ```html
 * <button [ccmsPopupMenuTrigger]="myMenu">Open Menu</button>
 *
 * <ccms-popup-menu #myMenu>
 *   <ccms-popup-menu-item>Item 1</ccms-popup-menu-item>
 * </ccms-popup-menu>
 * ```
 */
@Directive({
  selector: '[ccmsPopupMenuTrigger]',
  host: {
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'menu()?.isOpen() ?? false',
    '[class.open]': 'menu()?.isOpen() ?? false',
    '[class.closed]': '!(menu()?.isOpen() ?? false)',
  },
})
export class PopupMenuTriggerDirective {
  /** Reference to the popup menu component to trigger */
  menu = input.required<PopupMenuComponent>({ alias: 'ccmsPopupMenuTrigger' });

  private elementRef = inject(ElementRef);

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.menu().toggle(this.elementRef);
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Open menu on Enter, Space, or ArrowDown
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.menu().isOpen()) {
        this.menu().open(this.elementRef);
      }
    }
  }
}
