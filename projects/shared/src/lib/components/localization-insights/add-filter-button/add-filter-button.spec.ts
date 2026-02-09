import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AddFilterButtonComponent } from './add-filter-button';
import { FilterCategory } from '../../../models/filter.interface';

describe('AddFilterButtonComponent', () => {
  let component: AddFilterButtonComponent;
  let fixture: ComponentFixture<AddFilterButtonComponent>;

  const baseFilters: FilterCategory[] = [
    {
      id: 'due',
      label: 'Due Date',
      type: 'list',
      default: false,
      removable: true,
      selectionMode: 'single',
    },
    {
      id: 'job',
      label: 'Job(s)',
      type: 'list',
      default: false,
      removable: true,
      selectionMode: 'multi',
    },
  ];

  const metadataFilters: FilterCategory[] = [
    {
      id: 'metadata.author',
      label: 'Author',
      type: 'taxonomy',
      default: false,
      removable: true,
      metadata: true,
    },
    {
      id: 'metadata.product',
      label: 'Product',
      type: 'taxonomy',
      default: false,
      removable: true,
      metadata: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFilterButtonComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddFilterButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('availableFilters', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('isDisabled', () => {
    it('should be disabled when no filters available', () => {
      fixture.componentRef.setInput('availableFilters', []);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).isDisabled()).toBe(true);
    });

    it('should be enabled when base filters available', () => {
      fixture.componentRef.setInput('availableFilters', baseFilters);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).isDisabled()).toBe(false);
    });

    it('should be enabled when only metadata filters available', () => {
      fixture.componentRef.setInput('availableFilters', metadataFilters);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).isDisabled()).toBe(false);
    });

    it('should be enabled when both base and metadata filters available', () => {
      fixture.componentRef.setInput('availableFilters', [...baseFilters, ...metadataFilters]);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any).isDisabled()).toBe(false);
    });
  });

  describe('baseFilters', () => {
    it('should return only non-metadata filters', () => {
      fixture.componentRef.setInput('availableFilters', [...baseFilters, ...metadataFilters]);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (component as any).baseFilters();
      expect(base.length).toBe(2);
      expect(base.map((f: FilterCategory) => f.id)).toEqual(['due', 'job']);
    });

    it('should return empty array when only metadata filters', () => {
      fixture.componentRef.setInput('availableFilters', metadataFilters);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (component as any).baseFilters();
      expect(base.length).toBe(0);
    });
  });

  describe('metadataFilters', () => {
    it('should return only metadata filters', () => {
      fixture.componentRef.setInput('availableFilters', [...baseFilters, ...metadataFilters]);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = (component as any).metadataFilters();
      expect(metadata.length).toBe(2);
      expect(metadata.map((f: FilterCategory) => f.id)).toEqual([
        'metadata.author',
        'metadata.product',
      ]);
    });

    it('should return empty array when only base filters', () => {
      fixture.componentRef.setInput('availableFilters', baseFilters);
      fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = (component as any).metadataFilters();
      expect(metadata.length).toBe(0);
    });
  });

  describe('filterSelected output', () => {
    it('should emit when onItemSelected is called', () => {
      fixture.componentRef.setInput('availableFilters', baseFilters);
      fixture.detectChanges();

      let emittedFilter: FilterCategory | undefined;
      component.filterSelected.subscribe((filter) => {
        emittedFilter = filter;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any).onItemSelected(baseFilters[0]);

      expect(emittedFilter).toBeDefined();
      expect(emittedFilter?.id).toBe('due');
    });
  });
});
