import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PopupMenuComponent } from './popup-menu';
import { PopupMenuItemComponent, PopupMenuItemSelectedEvent } from './popup-menu-item';
import { PopupMenuTriggerDirective } from './popup-menu-trigger.directive';
import { PopupSubmenuComponent } from './popup-submenu';

describe('PopupMenuComponent', () => {
  let component: PopupMenuComponent;
  let fixture: ComponentFixture<PopupMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PopupMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  describe('open/close', () => {
    let triggerRef: ElementRef;

    beforeEach(() => {
      const mockElement = document.createElement('button');
      mockElement.getBoundingClientRect = () =>
        ({ top: 100, left: 200, bottom: 130, right: 300 }) as DOMRect;
      triggerRef = new ElementRef(mockElement);
    });

    it('should open when open() is called', () => {
      component.open(triggerRef);
      expect(component.isOpen()).toBe(true);
    });

    it('should close when close() is called', () => {
      component.open(triggerRef);
      component.close();
      expect(component.isOpen()).toBe(false);
    });

    it('should toggle open state', () => {
      component.toggle(triggerRef);
      expect(component.isOpen()).toBe(true);

      component.toggle(triggerRef);
      expect(component.isOpen()).toBe(false);
    });

    it('should emit opened event when opening', () => {
      const openedSpy = vi.fn();
      component.opened.subscribe(openedSpy);

      component.open(triggerRef);

      expect(openedSpy).toHaveBeenCalled();
    });

    it('should emit closed event when closing', () => {
      const closedSpy = vi.fn();
      component.closed.subscribe(closedSpy);

      component.open(triggerRef);
      component.close();

      expect(closedSpy).toHaveBeenCalled();
    });

    it('should not emit closed event when already closed', () => {
      const closedSpy = vi.fn();
      component.closed.subscribe(closedSpy);

      // Menu is already closed, calling close() should be a no-op
      component.close();

      expect(closedSpy).not.toHaveBeenCalled();
    });

    it('should handle right alignment', () => {
      fixture.componentRef.setInput('align', 'right');
      fixture.detectChanges();

      component.open(triggerRef);
      expect(component.isOpen()).toBe(true);
    });
  });

  describe('selection management', () => {
    it('should toggle value selection', () => {
      component.toggleValue('item1');
      expect(component.isValueSelected('item1')).toBe(true);

      component.toggleValue('item1');
      expect(component.isValueSelected('item1')).toBe(false);
    });

    it('should support multiple selections', () => {
      component.toggleValue('item1');
      component.toggleValue('item2');

      expect(component.isValueSelected('item1')).toBe(true);
      expect(component.isValueSelected('item2')).toBe(true);
    });

    it('should set selection programmatically', () => {
      component.setSelection(['a', 'b', 'c']);

      expect(component.isValueSelected('a')).toBe(true);
      expect(component.isValueSelected('b')).toBe(true);
      expect(component.isValueSelected('c')).toBe(true);
      expect(component.isValueSelected('d')).toBe(false);
    });

    it('should clear all selections', () => {
      component.setSelection(['a', 'b']);
      component.clearSelection();

      expect(component.isValueSelected('a')).toBe(false);
      expect(component.isValueSelected('b')).toBe(false);
    });

    it('should emit selectionChange when toggling', () => {
      const changeSpy = vi.fn();
      component.selectionChange.subscribe(changeSpy);

      component.toggleValue('item1');

      expect(changeSpy).toHaveBeenCalledWith(['item1']);
    });

    it('should emit selectionChange when setting selection', () => {
      const changeSpy = vi.fn();
      component.selectionChange.subscribe(changeSpy);

      component.setSelection(['a', 'b']);

      expect(changeSpy).toHaveBeenCalled();
      const emittedValue = changeSpy.mock.calls[changeSpy.mock.calls.length - 1][0] as string[];
      expect(emittedValue.sort()).toEqual(['a', 'b']);
    });

    it('should emit selectionChange when clearing', () => {
      component.setSelection(['a', 'b']);

      const changeSpy = vi.fn();
      component.selectionChange.subscribe(changeSpy);

      component.clearSelection();

      expect(changeSpy).toHaveBeenCalledWith([]);
    });
  });
});

// Test harness component for integration tests
@Component({
  template: `
    <button #trigger [ccmsPopupMenuTrigger]="menu">Open Menu</button>

    <ccms-popup-menu
      #menu
      [multiSelect]="multiSelect"
      (selectionChange)="onSelectionChange($event)"
    >
      <ccms-popup-menu-item value="item1" (selected)="onSelected($event)"
        >Item 1</ccms-popup-menu-item
      >
      <ccms-popup-menu-item value="item2" (selected)="onSelected($event)"
        >Item 2</ccms-popup-menu-item
      >
      <ccms-popup-menu-item value="item3" [disabled]="true">Item 3 (disabled)</ccms-popup-menu-item>
    </ccms-popup-menu>
  `,
  imports: [PopupMenuComponent, PopupMenuItemComponent, PopupMenuTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  multiSelect = false;
  selectedEvents: PopupMenuItemSelectedEvent[] = [];
  selectionChanges: string[][] = [];

  menu = viewChild.required<PopupMenuComponent>('menu');
  trigger = viewChild.required<ElementRef>('trigger');

  onSelected(event: PopupMenuItemSelectedEvent): void {
    this.selectedEvents.push(event);
  }

  onSelectionChange(values: string[]): void {
    this.selectionChanges.push(values);
  }
}

describe('PopupMenu Integration', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should open menu when trigger is clicked', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(true);
  });

  it('should close menu and emit selected when item is clicked (single-select)', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('ccms-popup-menu-item');
    item.click();
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(false);
    expect(component.selectedEvents.length).toBe(1);
    expect(component.selectedEvents[0].menu).toBe(component.menu());
    expect(component.selectedEvents[0].item.value()).toBe('item1');
  });

  it('should toggle selection without closing (multi-select)', () => {
    component.multiSelect = true;
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
    items[0].click();
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(true);
    expect(component.menu().isValueSelected('item1')).toBe(true);
    expect(items[0].classList.contains('selected')).toBe(true);
  });

  it('should not trigger disabled items', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
    const disabledItem = items[2];

    expect(disabledItem.classList.contains('disabled')).toBe(true);

    disabledItem.click();
    fixture.detectChanges();

    // Menu should still be open (disabled item doesn't close it)
    expect(component.menu().isOpen()).toBe(true);
  });

  it('should emit selectionChange in multi-select mode', () => {
    component.multiSelect = true;
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
    items[0].click();
    fixture.detectChanges();

    expect(component.selectionChanges.length).toBeGreaterThan(0);
    expect(component.selectionChanges[component.selectionChanges.length - 1]).toContain('item1');
  });

  it('should handle keyboard navigation - Enter to select', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('ccms-popup-menu-item');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    item.dispatchEvent(event);
    fixture.detectChanges();

    expect(component.selectedEvents.length).toBeGreaterThan(0);
    expect(component.selectedEvents[0].item.value()).toBe('item1');
  });

  it('should handle keyboard navigation - Space to select', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('ccms-popup-menu-item');
    const event = new KeyboardEvent('keydown', { key: ' ' });
    item.dispatchEvent(event);
    fixture.detectChanges();

    expect(component.selectedEvents.length).toBeGreaterThan(0);
    expect(component.selectedEvents[0].item.value()).toBe('item1');
  });

  it('should close menu on Escape key', async () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.menu().isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(false);
  });

  it('should close menu when clicking outside', async () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.menu().isOpen()).toBe(true);

    // Click on document body (outside menu)
    document.body.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(false);
  });

  it('should return focus to trigger on Escape', async () => {
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Focus an item inside the menu
    const item = fixture.nativeElement.querySelector('ccms-popup-menu-item') as HTMLElement;
    item.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger);
  });

  it('should emit selected event with menu and item references', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('ccms-popup-menu-item');
    item.click();
    fixture.detectChanges();

    expect(component.selectedEvents.length).toBe(1);
    const event = component.selectedEvents[0];

    // Verify event structure
    expect(event.menu).toBeDefined();
    expect(event.item).toBeDefined();
    expect(event.menu).toBe(component.menu());
    expect(event.item.value()).toBe('item1');
  });

  it('should deselect item when clicked again in multi-select mode', () => {
    component.multiSelect = true;
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');

    // Select item
    items[0].click();
    fixture.detectChanges();
    expect(component.menu().isValueSelected('item1')).toBe(true);

    // Deselect item
    items[0].click();
    fixture.detectChanges();
    expect(component.menu().isValueSelected('item1')).toBe(false);
  });

  it('should select multiple items in multi-select mode', () => {
    component.multiSelect = true;
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');

    items[0].click();
    items[1].click();
    fixture.detectChanges();

    expect(component.menu().isValueSelected('item1')).toBe(true);
    expect(component.menu().isValueSelected('item2')).toBe(true);
    expect(items[0].classList.contains('selected')).toBe(true);
    expect(items[1].classList.contains('selected')).toBe(true);
  });
});

// Test harness for submenu
@Component({
  template: `
    <button #trigger [ccmsPopupMenuTrigger]="menu">Open Menu</button>

    <ccms-popup-menu #menu>
      <ccms-popup-menu-item (selected)="onSelected($event)">Item 1</ccms-popup-menu-item>
      <ccms-popup-submenu label="Submenu" #submenu>
        <ccms-popup-menu-item (selected)="onSelected($event)">Sub Item 1</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onSelected($event)">Sub Item 2</ccms-popup-menu-item>
      </ccms-popup-submenu>
      <ccms-popup-submenu label="Disabled Submenu" [disabled]="true">
        <ccms-popup-menu-item (selected)="onSelected($event)">Should Not See</ccms-popup-menu-item>
      </ccms-popup-submenu>
    </ccms-popup-menu>
  `,
  imports: [
    PopupMenuComponent,
    PopupMenuItemComponent,
    PopupMenuTriggerDirective,
    PopupSubmenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestSubmenuHostComponent {
  selectedEvents: PopupMenuItemSelectedEvent[] = [];
  menu = viewChild.required<PopupMenuComponent>('menu');
  submenu = viewChild.required<PopupSubmenuComponent>('submenu');

  onSelected(event: PopupMenuItemSelectedEvent): void {
    this.selectedEvents.push(event);
  }
}

describe('PopupSubmenu Integration', () => {
  let fixture: ComponentFixture<TestSubmenuHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestSubmenuHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestSubmenuHostComponent);
    fixture.detectChanges();
  });

  it('should render submenu trigger with label', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');
    expect(submenu.textContent).toContain('Submenu');
  });

  it('should open submenu on mouseenter', async () => {
    vi.useFakeTimers();
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');
    submenu.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(150); // Wait for hover delay
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(true);
    vi.useRealTimers();
  });

  it('should close submenu on mouseleave', async () => {
    vi.useFakeTimers();
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');
    submenu.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(150);
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(true);

    submenu.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.advanceTimersByTimeAsync(150);
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(false);
    vi.useRealTimers();
  });

  it('should open submenu on ArrowRight key', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(true);
  });

  it('should open submenu on Enter key', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(true);
  });

  it('should close submenu on ArrowLeft key', async () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');

    // Open submenu first
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(submenu.classList.contains('open')).toBe(true);

    // Close with ArrowLeft
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(false);
  });

  it('should close submenu on Escape key', async () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');

    // Open submenu first
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(submenu.classList.contains('open')).toBe(true);

    // Close with Escape
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(false);
  });

  it('should not open disabled submenu on hover', async () => {
    vi.useFakeTimers();
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenus = fixture.nativeElement.querySelectorAll('ccms-popup-submenu');
    const disabledSubmenu = submenus[1]; // Second submenu is disabled

    expect(disabledSubmenu.classList.contains('disabled')).toBe(true);

    disabledSubmenu.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(150);
    fixture.detectChanges();

    expect(disabledSubmenu.classList.contains('open')).toBe(false);
    vi.useRealTimers();
  });

  it('should not open disabled submenu on keyboard', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenus = fixture.nativeElement.querySelectorAll('ccms-popup-submenu');
    const disabledSubmenu = submenus[1];

    disabledSubmenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(disabledSubmenu.classList.contains('open')).toBe(false);
  });

  it('should close submenu when parent menu closes', async () => {
    vi.useFakeTimers();
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const submenu = fixture.nativeElement.querySelector('ccms-popup-submenu');

    // Open submenu
    submenu.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(150);
    fixture.detectChanges();
    expect(submenu.classList.contains('open')).toBe(true);

    // Close parent menu
    fixture.componentInstance.menu().close();
    fixture.detectChanges();

    expect(submenu.classList.contains('open')).toBe(false);
    vi.useRealTimers();
  });
});

describe('PopupMenuTriggerDirective', () => {
  @Component({
    template: `
      <button [ccmsPopupMenuTrigger]="menu">Trigger</button>
      <ccms-popup-menu #menu></ccms-popup-menu>
    `,
    imports: [PopupMenuComponent, PopupMenuTriggerDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  class TriggerTestComponent {
    menu = viewChild.required<PopupMenuComponent>('menu');
  }

  let fixture: ComponentFixture<TriggerTestComponent>;
  let component: TriggerTestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have aria-haspopup attribute', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('should update aria-expanded when menu opens', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('should open menu on Enter key', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(true);
  });

  it('should open menu on Space key', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(true);
  });

  it('should open menu on ArrowDown key', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    expect(component.menu().isOpen()).toBe(true);
  });

  it('should add open class when menu is open', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    expect(trigger.classList.contains('open')).toBe(false);
    expect(trigger.classList.contains('closed')).toBe(true);

    trigger.click();
    fixture.detectChanges();

    expect(trigger.classList.contains('open')).toBe(true);
    expect(trigger.classList.contains('closed')).toBe(false);
  });
});
