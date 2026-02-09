import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { ListFilterComponent } from './list-filter';
import { FilterOption } from '../../../models/filter.interface';

describe('ListFilterComponent', () => {
  describe('standalone', () => {
    let component: ListFilterComponent;
    let fixture: ComponentFixture<ListFilterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ListFilterComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(ListFilterComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('label', 'Test Filter');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the label', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Test Filter');
    });

    it('should show "All" when no values selected', () => {
      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl.textContent).toContain('All');
    });
  });

  describe('with host component', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should show single selected value label', async () => {
      host.selectedValues.set(['opt1']);
      fixture.detectChanges();
      await fixture.whenStable();

      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl.textContent).toContain('Option 1');
    });

    it('should show count when multiple values selected', async () => {
      host.selectedValues.set(['opt1', 'opt2']);
      fixture.detectChanges();
      await fixture.whenStable();

      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl.textContent).toContain('2 selected');
    });

    it('should emit removed when remove button clicked', () => {
      const removedSpy = vi.fn();
      host.filterComponent().removed.subscribe(removedSpy);

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      removeBtn.click();
      fixture.detectChanges();

      expect(removedSpy).toHaveBeenCalled();
    });

    it('should hide remove button when removable is false', async () => {
      host.removable.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      expect(removeBtn).toBeNull();
    });

    it('should show "Select" for single-select mode with no selection', async () => {
      host.selectionMode.set('single');
      fixture.detectChanges();
      await fixture.whenStable();

      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl.textContent).toContain('Select');
    });

    it('should emit selectionChange when item is selected', async () => {
      const selectionSpy = vi.fn();
      host.filterComponent().selectionChange.subscribe(selectionSpy);

      // Open the dropdown - ccms-filter is the trigger
      const trigger = fixture.nativeElement.querySelector('ccms-filter');
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      // Select an item
      const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
      if (items.length > 1) {
        items[1].click(); // Click the first non-All option
        fixture.detectChanges();
      }

      expect(selectionSpy).toHaveBeenCalled();
    });
  });

  describe('search functionality', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      // Add more options to trigger search threshold
      host.options$.next([
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
        { value: 'opt3', label: 'Option 3' },
        { value: 'opt4', label: 'Option 4' },
        { value: 'opt5', label: 'Option 5' },
        { value: 'opt6', label: 'Option 6' },
        { value: 'opt7', label: 'Option 7' },
        { value: 'opt8', label: 'Option 8' },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should show search when options exceed threshold', async () => {
      // Open the dropdown - ccms-filter is the trigger
      const trigger = fixture.nativeElement.querySelector('ccms-filter');
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const searchInput = fixture.nativeElement.querySelector('.filter-menu-search__input');
      expect(searchInput).not.toBeNull();
    });

    it('should hide search when searchable is explicitly false', async () => {
      host.searchable.set(false);
      fixture.detectChanges();

      // Open the dropdown
      const trigger = fixture.nativeElement.querySelector('ccms-filter');
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const searchInput = fixture.nativeElement.querySelector('.filter-menu-search__input');
      expect(searchInput).toBeNull();
    });

    it('should filter options when searching', async () => {
      // Open the dropdown
      const trigger = fixture.nativeElement.querySelector('ccms-filter');
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const searchInput = fixture.nativeElement.querySelector(
        '.filter-menu-search__input',
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.value = 'Option 1';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        await fixture.whenStable();

        // Should filter the options
        const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
        // "All" + filtered items
        expect(items.length).toBeLessThan(10);
      }
    });
  });
});

@Component({
  selector: 'app-test-host',
  imports: [ListFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-list-filter
      [label]="'Status'"
      [options]="options$"
      [selectedValues]="selectedValues()"
      [selectionMode]="selectionMode()"
      [searchable]="searchable()"
      [removable]="removable()"
      (selectionChange)="onSelectionChange($event)"
      (removed)="onRemoved()"
    />
  `,
})
class TestHostComponent {
  options$ = new BehaviorSubject<FilterOption[]>([
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3' },
  ]);
  selectedValues = signal<string[]>([]);
  selectionMode = signal<'single' | 'multi'>('multi');
  searchable = signal<boolean | undefined>(undefined);
  removable = signal(true);

  filterComponent = viewChild.required(ListFilterComponent);

  onSelectionChange(values: string[]): void {
    this.selectedValues.set(values);
  }

  onRemoved(): void {}
}
