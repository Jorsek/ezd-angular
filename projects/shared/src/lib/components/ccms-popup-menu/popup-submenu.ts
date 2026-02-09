import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  NgZone,
  DestroyRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PopupMenuComponent } from './popup-menu';

/**
 * Submenu component for nested menus that open on hover.
 *
 * @example
 * ```html
 * <ccms-popup-menu #menu>
 *   <ccms-popup-menu-item (selected)="onEdit()">Edit</ccms-popup-menu-item>
 *   <ccms-popup-submenu label="Export">
 *     <ccms-popup-menu-item (selected)="onPdf()">PDF</ccms-popup-menu-item>
 *     <ccms-popup-menu-item (selected)="onWord()">Word</ccms-popup-menu-item>
 *   </ccms-popup-submenu>
 * </ccms-popup-menu>
 * ```
 */
@Component({
  selector: 'ccms-popup-submenu',
  template: `
    {{ label() }}
    @if (isOpen()) {
      <div
        #submenuPanel
        class="submenu-panel"
        [style.top.px]="top()"
        [style.left.px]="left()"
        [style.max-height.px]="maxHeight()"
        role="menu"
        aria-orientation="vertical"
      >
        <ng-content />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'menuitem',
    tabindex: '0',
    'aria-haspopup': 'menu',
    '[class.open]': 'isOpen()',
    '[class.disabled]': 'disabled()',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-disabled]': 'disabled()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PopupSubmenuComponent implements OnDestroy {
  /** Label displayed for the submenu trigger */
  label = input.required<string>();

  /** Whether the submenu trigger is disabled */
  disabled = input<boolean>(false);

  /** Delay in ms before showing submenu on hover */
  hoverDelay = input<number>(100);

  // State
  protected isOpen = signal<boolean>(false);
  protected top = signal<number>(0);
  protected left = signal<number>(0);
  protected maxHeight = signal<number | null>(null);

  // Reference to submenu panel for ResizeObserver
  @ViewChild('submenuPanel', { static: false }) submenuPanelRef?: ElementRef<HTMLDivElement>;

  // Dependencies
  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  private parentMenu = inject(PopupMenuComponent, { optional: true });
  private destroyRef = inject(DestroyRef);

  // Hover control
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  private submenuClosed$ = new Subject<void>();

  // ResizeObserver for measuring submenu dimensions
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    // Close submenu when parent menu closes
    this.parentMenu?.closed.subscribe(() => {
      this.close();
    });
  }

  ngOnDestroy(): void {
    this.clearHoverTimeout();
    this.resizeObserver?.disconnect();
  }

  private clearHoverTimeout(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  protected onMouseEnter(): void {
    this.clearHoverTimeout();
    if (this.disabled()) {
      return;
    }
    this.hoverTimeout = setTimeout(() => {
      this.open();
    }, this.hoverDelay());
  }

  protected onMouseLeave(): void {
    this.clearHoverTimeout();
    this.hoverTimeout = setTimeout(() => {
      this.close();
    }, this.hoverDelay());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.open();
    } else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      if (this.isOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    }
  }

  private open(): void {
    if (this.isOpen()) {
      return;
    }

    this.isOpen.set(true);

    // Use setTimeout to wait for panel to render, then observe its size
    setTimeout(() => {
      if (!this.submenuPanelRef) return;

      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver((entries) => {
        // Only run once after initial render
        this.resizeObserver?.disconnect();

        const panelRect = entries[0]?.contentRect;
        if (!panelRect) return;

        this.ngZone.run(() => {
          this.positionSubmenu(panelRect.width, panelRect.height);
        });
      });
      this.resizeObserver.observe(this.submenuPanelRef.nativeElement);
    }, 0);

    // Set up click outside listener for submenu
    this.ngZone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(document, 'click')
        .pipe(
          filter(() => this.isOpen()),
          filter((event) => !this.elementRef.nativeElement.contains(event.target)),
          takeUntil(this.submenuClosed$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.ngZone.run(() => this.close());
        });
    });
  }

  /**
   * Position the submenu panel, respecting viewport bounds.
   * Default: opens to the right. Flips to left if would overflow right edge.
   */
  private positionSubmenu(panelWidth: number, panelHeight: number): void {
    const triggerRect = this.elementRef.nativeElement.getBoundingClientRect();
    const offset = this.getTransformedAncestorOffset();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const VIEWPORT_PADDING = 16; // Padding from viewport edges

    // Calculate horizontal position (default: to the right of trigger)
    let left = triggerRect.right - offset.left;

    // Check if submenu would overflow right edge of viewport
    if (left + panelWidth > viewportWidth) {
      // Flip to left side of trigger
      left = triggerRect.left - panelWidth - offset.left;

      // If still overflows left, position at left edge with padding
      if (left < 0) {
        left = VIEWPORT_PADDING;
      }
    }

    // Calculate vertical position (default: aligned with trigger top)
    let top = triggerRect.top - offset.top;

    // Calculate available space below the trigger position
    const spaceBelow = viewportHeight - triggerRect.top - VIEWPORT_PADDING;

    // Calculate max-height based on available space
    let maxHeight = spaceBelow;

    // If submenu would overflow, check if we should shift it up
    if (top + panelHeight > viewportHeight - VIEWPORT_PADDING) {
      // If the panel is taller than viewport, position at top with full available height
      if (panelHeight > viewportHeight - 2 * VIEWPORT_PADDING) {
        top = VIEWPORT_PADDING;
        maxHeight = viewportHeight - 2 * VIEWPORT_PADDING;
      } else {
        // Shift up so bottom aligns with viewport bottom (with padding)
        top = viewportHeight - panelHeight - VIEWPORT_PADDING;
        maxHeight = spaceBelow;
      }
    }

    // Ensure top doesn't go above viewport
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
      maxHeight = viewportHeight - 2 * VIEWPORT_PADDING;
    }

    this.top.set(top);
    this.left.set(left);
    this.maxHeight.set(maxHeight);
  }

  private close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.submenuClosed$.next();
  }

  /**
   * Find the nearest ancestor with a transform (which creates a new containing block
   * for position: fixed) and return its offset from the viewport.
   */
  private getTransformedAncestorOffset(): { top: number; left: number } {
    let el: HTMLElement | null = this.elementRef.nativeElement.parentElement;

    while (el) {
      const style = getComputedStyle(el);
      // These CSS properties create a new containing block for fixed positioning
      if (
        style.transform !== 'none' ||
        style.filter !== 'none' ||
        style.perspective !== 'none' ||
        style.willChange === 'transform' ||
        style.willChange === 'filter' ||
        style.contain === 'paint' ||
        style.contain === 'layout' ||
        style.contain === 'strict' ||
        style.contain === 'content'
      ) {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, left: rect.left };
      }
      el = el.parentElement;
    }

    return { top: 0, left: 0 };
  }
}
