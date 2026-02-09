import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/** Horizontal alignment of the menu relative to the trigger */
export type PopupMenuAlign = 'left' | 'right';

/**
 * Popup Menu Component
 *
 * A dropdown menu that can be triggered by any element using the PopupMenuTriggerDirective.
 * Supports both single-select and multi-select modes.
 *
 * @example Single-select usage:
 * ```html
 * <button [ccmsPopupMenuTrigger]="actionsMenu">Actions</button>
 *
 * <ccms-popup-menu #actionsMenu>
 *   <ccms-popup-menu-item (selected)="onEdit()">Edit</ccms-popup-menu-item>
 *   <ccms-popup-menu-item (selected)="onDelete()">Delete</ccms-popup-menu-item>
 * </ccms-popup-menu>
 * ```
 *
 * @example Multi-select usage:
 * ```html
 * <button [ccmsPopupMenuTrigger]="filterMenu">Filter</button>
 *
 * <ccms-popup-menu #filterMenu [multiSelect]="true" (selectionChange)="onFiltersChange($event)">
 *   <ccms-popup-menu-item value="active">Active</ccms-popup-menu-item>
 *   <ccms-popup-menu-item value="pending">Pending</ccms-popup-menu-item>
 * </ccms-popup-menu>
 * ```
 */
@Component({
  selector: 'ccms-popup-menu',
  template: `@if (isOpen()) {
    <ng-content />
  }`,
  styleUrl: './popup-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'menu',
    'aria-orientation': 'vertical',
    '[class.open]': 'isOpen()',
    '[style.top.px]': 'isOpen() ? top() : null',
    '[style.left.px]': 'isOpen() ? left() : null',
    '[style.max-height.px]': 'isOpen() ? maxHeight() : null',
    // Stop click propagation so clicks inside the menu don't bubble to the trigger
    '(click)': '$event.stopPropagation()',
  },
})
export class PopupMenuComponent implements OnDestroy {
  // Static Subject to coordinate closing other popups when one opens
  private static openingMenu$ = new Subject<PopupMenuComponent>();

  // Inputs
  multiSelect = input<boolean>(false);
  /** Horizontal alignment relative to trigger: 'left' aligns left edges, 'right' aligns right edges */
  align = input<PopupMenuAlign>('left');
  /** Initial/current selection values (for two-way binding with selectionChange) */
  selectedValues = input<string[]>([]);

  // Events/Outputs
  selectionChange = output<string[]>();
  opened = output<void>();
  closed = output<void>();

  // State & signals
  public isOpen = signal<boolean>(false);
  public top = signal<number>(0);
  public left = signal<number>(0);
  public maxHeight = signal<number | null>(null);
  private selection = signal<Set<string>>(new Set());

  // Dependencies
  private ngZone = inject(NgZone);
  private elementRef = inject(ElementRef);
  private triggerRef: ElementRef | null = null;
  private destroyed = inject(DestroyRef);

  // Subject to signal when menu closes (stops event listeners)
  private menuClosed$ = new Subject<void>();

  // ResizeObserver for measuring menu dimensions
  private resizeObserver: ResizeObserver | null = null;

  // Track if a scroll reposition is pending (for requestAnimationFrame throttling)
  private scrollRepositionPending = false;

  constructor() {
    // Sync internal selection when selectedValues input changes
    effect(() => {
      const values = this.selectedValues();
      const currentSelection = untracked(() => this.selection());

      // Only update if values actually differ to avoid unnecessary change detection
      const isDifferent =
        values.length !== currentSelection.size || !values.every((v) => currentSelection.has(v));

      if (isDifferent) {
        this.selection.set(new Set(values));
      }
    });

    // Close this popup when a different popup opens
    PopupMenuComponent.openingMenu$
      .pipe(
        filter((menu) => menu !== this && this.isOpen()),
        takeUntilDestroyed(this.destroyed),
      )
      .subscribe(() => {
        this.close();
      });
  }

  private emitSelectionChange(): void {
    this.selectionChange.emit([...this.selection()]);
  }

  /**
   * Toggle the menu open/closed state
   */
  toggle(triggerRef: ElementRef): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open(triggerRef);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.menuClosed$.complete();
  }

  /**
   * Open the menu and position it relative to the trigger element
   */
  open(triggerRef: ElementRef): void {
    // Notify other popups to close
    PopupMenuComponent.openingMenu$.next(this);

    this.triggerRef = triggerRef;
    this.isOpen.set(true);
    this.opened.emit();

    // Use ResizeObserver to position after the menu renders and we know its dimensions
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver((entries) => {
      // Only run once after initial render
      this.resizeObserver?.disconnect();

      const menuRect = entries[0]?.contentRect;
      if (!menuRect) return;

      this.ngZone.run(() => {
        this.positionMenu(triggerRef, menuRect.width, menuRect.height);
      });
    });
    this.resizeObserver.observe(this.elementRef.nativeElement);

    // Set up event listeners outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      // Click outside to close
      fromEvent<MouseEvent>(document, 'click')
        .pipe(
          filter(() => this.isOpen()),
          filter((event) => !this.elementRef.nativeElement.contains(event.target)),
          takeUntil(this.menuClosed$),
          takeUntilDestroyed(this.destroyed),
        )
        .subscribe(() => {
          this.ngZone.run(() => this.close());
        });

      // Escape key to close and return focus
      fromEvent<KeyboardEvent>(document, 'keydown')
        .pipe(
          filter(() => this.isOpen()),
          filter((event) => event.key === 'Escape'),
          takeUntil(this.menuClosed$),
          takeUntilDestroyed(this.destroyed),
        )
        .subscribe(() => {
          this.ngZone.run(() => {
            this.close();
            this.triggerRef?.nativeElement?.focus();
          });
        });

      // Reposition menu on scroll (use capture to catch scroll on any ancestor)
      fromEvent(document, 'scroll', { capture: true, passive: true })
        .pipe(
          filter(() => this.isOpen()),
          takeUntil(this.menuClosed$),
          takeUntilDestroyed(this.destroyed),
        )
        .subscribe(() => {
          this.repositionOnScroll();
        });
    });
  }

  /**
   * Reposition the menu on scroll, throttled via requestAnimationFrame.
   * Closes the menu if the trigger scrolls out of view.
   */
  private repositionOnScroll(): void {
    if (this.scrollRepositionPending || !this.triggerRef) return;

    this.scrollRepositionPending = true;
    requestAnimationFrame(() => {
      this.scrollRepositionPending = false;
      if (!this.isOpen() || !this.triggerRef) return;

      // Check if trigger is still visible in viewport
      const triggerRect = this.triggerRef.nativeElement.getBoundingClientRect();
      const isOutOfView =
        triggerRect.bottom < 0 ||
        triggerRect.top > window.innerHeight ||
        triggerRect.right < 0 ||
        triggerRect.left > window.innerWidth;

      if (isOutOfView) {
        this.ngZone.run(() => this.close());
        return;
      }

      const menuEl = this.elementRef.nativeElement as HTMLElement;
      const menuRect = menuEl.getBoundingClientRect();

      this.ngZone.run(() => {
        this.positionMenu(this.triggerRef!, menuRect.width, menuRect.height);
      });
    });
  }

  /**
   * Position the menu relative to the trigger, respecting alignment and viewport bounds
   */
  private positionMenu(triggerRef: ElementRef, menuWidth: number, menuHeight: number): void {
    const triggerRect = triggerRef.nativeElement.getBoundingClientRect();
    const offset = this.getTransformedAncestorOffset();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const VIEWPORT_PADDING = 16; // Padding from viewport edges

    // Calculate horizontal position based on alignment
    let left: number;
    if (this.align() === 'right') {
      // Align right edges: trigger's right edge = menu's right edge
      left = triggerRect.right - menuWidth - offset.left;
    } else {
      // Align left edges (default)
      left = triggerRect.left - offset.left;
    }

    // Viewport boundary checks - horizontal
    if (left + menuWidth > viewportWidth) {
      // Would overflow right edge - align to right edge of viewport with padding
      left = viewportWidth - menuWidth - 8;
    }
    if (left < 0) {
      // Would overflow left edge - align to left edge with padding
      left = 8;
    }

    // Calculate available space below and above the trigger
    const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING;
    const spaceAbove = triggerRect.top - offset.top - VIEWPORT_PADDING;

    // Determine positioning strategy
    let top: number;
    let maxHeight: number;

    if (menuHeight <= spaceBelow || spaceBelow >= spaceAbove) {
      // Position below trigger (default)
      top = triggerRect.bottom - offset.top;
      maxHeight = spaceBelow;
    } else {
      // Position above trigger (more space available)
      maxHeight = spaceAbove;
      // If menu fits above, align bottom with trigger top
      if (menuHeight <= spaceAbove) {
        top = triggerRect.top - menuHeight - offset.top;
      } else {
        // Menu is taller than available space - position at top with padding
        top = VIEWPORT_PADDING;
      }
    }

    this.top.set(top);
    this.left.set(left);
    this.maxHeight.set(maxHeight);
  }

  /**
   * Close the menu and clean up listeners
   */
  close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.closed.emit();
    this.menuClosed$.next();
  }

  /**
   * Check if a value is currently selected (for multi-select mode)
   */
  isValueSelected(value: string): boolean {
    return this.selection().has(value);
  }

  /**
   * Check if the selection is empty (no values selected)
   */
  isSelectionEmpty(): boolean {
    return this.selection().size === 0;
  }

  /**
   * Toggle a value's selection state (for multi-select mode)
   */
  toggleValue(value: string): void {
    const values = new Set(this.selection());
    if (values.has(value)) {
      values.delete(value);
    } else {
      values.add(value);
    }
    this.selection.set(values);
    this.emitSelectionChange();
  }

  /**
   * Clear all selections (for multi-select mode)
   */
  clearSelection(): void {
    this.selection.set(new Set());
    this.emitSelectionChange();
  }

  /**
   * Set the selected values programmatically (for multi-select mode)
   */
  setSelection(values: string[]): void {
    this.selection.set(new Set(values));
    this.emitSelectionChange();
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
