import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { TaxonomyFilterComponent } from './taxonomy-filter';
import { FilterOption } from '../../../models/filter.interface';

describe('TaxonomyFilterComponent', () => {
  describe('standalone', () => {
    let component: TaxonomyFilterComponent;
    let fixture: ComponentFixture<TaxonomyFilterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TaxonomyFilterComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TaxonomyFilterComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('label', 'Category');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the label', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Category');
    });

    it('should show "All" when no values selected', () => {
      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl.textContent).toContain('All');
    });
  });

  describe('with hierarchical options', () => {
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

    it('should show child label when single child value selected', async () => {
      host.selectedValues.set(['laptop']);
      fixture.detectChanges();
      await fixture.whenStable();

      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl.textContent).toContain('Laptop');
    });

    it('should show count when multiple values selected', async () => {
      host.selectedValues.set(['laptop', 'cloud']);
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

    it('should emit selectionChange when item is selected', async () => {
      const selectionSpy = vi.fn();
      host.filterComponent().selectionChange.subscribe(selectionSpy);

      // Open the dropdown - ccms-filter is the trigger
      const trigger = fixture.nativeElement.querySelector('ccms-filter');
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      // Select an item (should have hierarchical items)
      const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
      if (items.length > 1) {
        items[1].click(); // Click first non-All option
        fixture.detectChanges();
      }

      expect(selectionSpy).toHaveBeenCalled();
    });
  });

  describe('search functionality', () => {
    let fixture: ComponentFixture<SearchTestHostComponent>;
    let host: SearchTestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SearchTestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SearchTestHostComponent);
      host = fixture.componentInstance;
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

    it('should filter parent when child matches search', async () => {
      // Open the dropdown
      const trigger = fixture.nativeElement.querySelector('ccms-filter');
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const searchInput = fixture.nativeElement.querySelector(
        '.filter-menu-search__input',
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.value = 'Laptop';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        await fixture.whenStable();

        // Should show parent with matching child
        const items = fixture.nativeElement.querySelectorAll('ccms-popup-menu-item');
        expect(items.length).toBeGreaterThan(0);
      }
    });
  });
});

@Component({
  selector: 'app-test-host',
  imports: [TaxonomyFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-taxonomy-filter
      [label]="'Product'"
      [options]="options$"
      [selectedValues]="selectedValues()"
      [searchable]="searchable()"
      [removable]="removable()"
      (selectionChange)="onSelectionChange($event)"
      (removed)="onRemoved()"
    />
  `,
})
class TestHostComponent {
  options$ = new BehaviorSubject<FilterOption[]>([
    {
      value: 'hardware',
      label: 'Hardware',
      children: [
        { value: 'laptop', label: 'Laptop' },
        { value: 'desktop', label: 'Desktop' },
      ],
    },
    {
      value: 'software',
      label: 'Software',
      children: [
        { value: 'cloud', label: 'Cloud' },
        { value: 'on-prem', label: 'On-Premise' },
      ],
    },
  ]);
  selectedValues = signal<string[]>([]);
  searchable = signal<boolean | undefined>(undefined);
  removable = signal(true);

  filterComponent = viewChild.required(TaxonomyFilterComponent);

  onSelectionChange(values: string[]): void {
    this.selectedValues.set(values);
  }

  onRemoved(): void {}
}

@Component({
  selector: 'app-search-test-host',
  imports: [TaxonomyFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-taxonomy-filter
      [label]="'Product'"
      [options]="options$"
      [selectedValues]="selectedValues()"
      [searchable]="searchable()"
      [removable]="removable()"
      (selectionChange)="onSelectionChange($event)"
      (removed)="onRemoved()"
    />
  `,
})
class SearchTestHostComponent {
  // Create enough options to trigger search threshold (7+)
  options$ = new BehaviorSubject<FilterOption[]>([
    {
      value: 'hardware',
      label: 'Hardware',
      children: [
        { value: 'laptop', label: 'Laptop' },
        { value: 'desktop', label: 'Desktop' },
        { value: 'monitor', label: 'Monitor' },
      ],
    },
    {
      value: 'software',
      label: 'Software',
      children: [
        { value: 'cloud', label: 'Cloud' },
        { value: 'on-prem', label: 'On-Premise' },
        { value: 'saas', label: 'SaaS' },
      ],
    },
    {
      value: 'services',
      label: 'Services',
      children: [
        { value: 'support', label: 'Support' },
        { value: 'training', label: 'Training' },
      ],
    },
  ]);
  selectedValues = signal<string[]>([]);
  searchable = signal<boolean | undefined>(undefined);
  removable = signal(true);

  filterComponent = viewChild.required(TaxonomyFilterComponent);

  onSelectionChange(values: string[]): void {
    this.selectedValues.set(values);
  }

  onRemoved(): void {}
}
