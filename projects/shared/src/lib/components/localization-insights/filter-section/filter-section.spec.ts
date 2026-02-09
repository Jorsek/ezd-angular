import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { FilterSectionComponent, FILTER_DEBOUNCE_MS } from './filter-section';
import { FilterCategory } from '../../../models/filter.interface';
import { ViewFilter } from '../../insights-views';

const mockFilters: FilterCategory[] = [
  {
    id: 'locale',
    label: 'Locale',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    options: () =>
      of([
        { value: 'en-US', label: 'English (US)' },
        { value: 'de-DE', label: 'German' },
      ]),
  },
  {
    id: 'localizedStatus',
    label: 'Localized Status',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    options: () =>
      of([
        { value: 'up-to-date', label: 'Up to Date' },
        { value: 'outdated', label: 'Outdated' },
      ]),
  },
  {
    id: 'jobStatus',
    label: 'Job Status',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: false,
    options: () =>
      of([
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
      ]),
  },
  {
    id: 'fileName',
    label: 'File Name',
    type: 'text',
    default: true,
    removable: false,
  },
  {
    id: 'search',
    label: 'Search',
    type: 'search',
    default: true,
    removable: false,
  },
];

describe('FilterSectionComponent', () => {
  let component: FilterSectionComponent;
  let fixture: ComponentFixture<FilterSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSectionComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('allFilters', mockFilters);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('display filters from inputs', () => {
    it('should show default filters when activeFilters is empty', () => {
      const display = component['displayFilters']();
      const ids = display.map((f) => f.category.id);

      expect(ids).toContain('locale');
      expect(ids).toContain('localizedStatus');
      // Note: search filter is excluded from displayFilters (handled separately via showSearchFilter)
      expect(ids).not.toContain('search');
      expect(ids).not.toContain('jobStatus');
    });

    it('should show selections from activeFilters input', async () => {
      fixture.componentRef.setInput('activeFilters', [
        { field: 'locale', list: ['en-US', 'de-DE'] },
      ]);
      await fixture.whenStable();

      const display = component['displayFilters']();
      const localeFilter = display.find((f) => f.category.id === 'locale');

      expect(localeFilter?.selectedValues).toEqual(['en-US', 'de-DE']);
    });

    it('should show non-default filters present in activeFilters input', async () => {
      fixture.componentRef.setInput('activeFilters', [{ field: 'jobStatus', list: ['active'] }]);
      await fixture.whenStable();

      const display = component['displayFilters']();
      const ids = display.map((f) => f.category.id);

      expect(ids).toContain('jobStatus');
    });

    it('should show empty selections for default filters with no values', () => {
      const display = component['displayFilters']();

      for (const filter of display) {
        expect(filter.selectedValues).toEqual([]);
      }
    });
  });

  describe('user interactions', () => {
    it('should update display immediately on list selection', () => {
      component['onSelectionChange']('locale', ['en-US']);

      const display = component['displayFilters']();
      const localeFilter = display.find((f) => f.category.id === 'locale');

      expect(localeFilter?.selectedValues).toEqual(['en-US']);
    });

    it('should update display immediately on text value change', () => {
      component['onTextValueChange']('fileName', 'test query');

      const display = component['displayFilters']();
      const fileNameFilter = display.find((f) => f.category.id === 'fileName');

      expect(fileNameFilter?.selectedValues).toEqual(['test query']);
    });

    it('should add a non-default filter when onFilterAdded is called', () => {
      const jobStatusCategory = mockFilters.find((f) => f.id === 'jobStatus')!;
      component['onFilterAdded'](jobStatusCategory);

      const display = component['displayFilters']();
      const ids = display.map((f) => f.category.id);

      expect(ids).toContain('jobStatus');
    });

    it('should remove a non-default filter when onFilterRemoved is called', () => {
      vi.useFakeTimers();
      const jobStatusCategory = mockFilters.find((f) => f.id === 'jobStatus')!;
      component['onFilterAdded'](jobStatusCategory);

      expect(component['displayFilters']().map((f) => f.category.id)).toContain('jobStatus');

      component['onFilterRemoved']('jobStatus');
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      expect(component['displayFilters']().map((f) => f.category.id)).not.toContain('jobStatus');
    });
  });

  describe('emission behavior', () => {
    it('should not emit synchronously on selection change', () => {
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onSelectionChange']('locale', ['en-US']);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit ViewFilter[] after debounce', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onSelectionChange']('locale', ['en-US', 'de-DE']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      expect(emitted).toContainEqual({ field: 'locale', list: ['en-US', 'de-DE'] });
    });

    it('should emit { field, list } shape for list selection', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onSelectionChange']('locale', ['en-US']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      const localeFilter = emitted.find((f) => f.field === 'locale');
      expect(localeFilter).toEqual({ field: 'locale', list: ['en-US'] });
    });

    it('should emit { field, value } shape for text input', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onTextValueChange']('fileName', 'hello');
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      const fileNameFilter = emitted.find((f) => f.field === 'fileName');
      expect(fileNameFilter).toEqual({ field: 'fileName', value: 'hello' });
    });

    it('should batch multiple selections within debounce window', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onSelectionChange']('locale', ['en-US']);
      component['onSelectionChange']('localizedStatus', ['up-to-date']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      expect(emitted).toContainEqual({ field: 'locale', list: ['en-US'] });
      expect(emitted).toContainEqual({ field: 'localizedStatus', list: ['up-to-date'] });
    });

    it('should exclude empty filters from emission', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onSelectionChange']('locale', ['en-US']);
      component['onSelectionChange']('localizedStatus', []);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      expect(emitted.find((f) => f.field === 'localizedStatus')).toBeUndefined();
      expect(emitted).toContainEqual({ field: 'locale', list: ['en-US'] });
    });

    it('should exclude removed filter from next emission', () => {
      vi.useFakeTimers();
      const jobStatusCategory = mockFilters.find((f) => f.id === 'jobStatus')!;
      component['onFilterAdded'](jobStatusCategory);
      component['onSelectionChange']('jobStatus', ['active']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      // Remove the filter, then trigger a new selection on a different field
      component['onFilterRemoved']('jobStatus');
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      // Next emission should not include the removed filter
      component['onSelectionChange']('locale', ['en-US']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      expect(emitted.find((f) => f.field === 'jobStatus')).toBeUndefined();
      expect(emitted).toContainEqual({ field: 'locale', list: ['en-US'] });
    });

    it('should emit when a filter is removed (not silently swallow the removal)', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      const jobStatusCategory = mockFilters.find((f) => f.id === 'jobStatus')!;
      component['onFilterAdded'](jobStatusCategory);
      component['onSelectionChange']('jobStatus', ['active']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Now remove the filter — this should emit an updated state without jobStatus
      component['onFilterRemoved']('jobStatus');
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      expect(emitSpy).toHaveBeenCalledTimes(2);
      const emitted: ViewFilter[] = emitSpy.mock.calls[1][0];
      expect(emitted.find((f) => f.field === 'jobStatus')).toBeUndefined();
    });

    it('should not emit when no pending selections exist', () => {
      vi.useFakeTimers();
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS * 2);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('clear behavior', () => {
    it('should emit empty array immediately on clear (no debounce)', () => {
      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onClear']();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith([]);
    });

    it('should reset added filters on clear', () => {
      const jobStatusCategory = mockFilters.find((f) => f.id === 'jobStatus')!;
      component['onFilterAdded'](jobStatusCategory);

      component['onClear']();

      const display = component['displayFilters']();
      expect(display.map((f) => f.category.id)).not.toContain('jobStatus');
    });

    it('should reset pending selections on clear', () => {
      component['onSelectionChange']('locale', ['en-US']);
      component['onClear']();

      const display = component['displayFilters']();
      const localeFilter = display.find((f) => f.category.id === 'locale');
      expect(localeFilter?.selectedValues).toEqual([]);
    });
  });

  describe('computed helpers', () => {
    it('should compute hasFilters as false with no selections', () => {
      expect(component['hasFilters']()).toBe(false);
    });

    it('should compute hasFilters as true when a filter has values', () => {
      component['onSelectionChange']('locale', ['en-US']);
      expect(component['hasFilters']()).toBe(true);
    });

    it('should compute remainingFilters excluding displayed non-defaults', () => {
      const remaining = component['remainingFilters']();
      expect(remaining.some((f) => f.id === 'jobStatus')).toBe(true);

      const jobStatusCategory = mockFilters.find((f) => f.id === 'jobStatus')!;
      component['onFilterAdded'](jobStatusCategory);

      const remainingAfter = component['remainingFilters']();
      expect(remainingAfter.some((f) => f.id === 'jobStatus')).toBe(false);
    });
  });

  describe('input/pending merge', () => {
    it('should prefer pending over input for the same field', async () => {
      fixture.componentRef.setInput('activeFilters', [{ field: 'locale', list: ['en-US'] }]);
      await fixture.whenStable();

      component['onSelectionChange']('locale', ['de-DE']);

      const display = component['displayFilters']();
      const localeFilter = display.find((f) => f.category.id === 'locale');
      expect(localeFilter?.selectedValues).toEqual(['de-DE']);
    });

    it('should merge input and pending for different fields', async () => {
      fixture.componentRef.setInput('activeFilters', [{ field: 'locale', list: ['en-US'] }]);
      await fixture.whenStable();

      component['onSelectionChange']('localizedStatus', ['up-to-date']);

      const display = component['displayFilters']();
      const localeFilter = display.find((f) => f.category.id === 'locale');
      const statusFilter = display.find((f) => f.category.id === 'localizedStatus');

      expect(localeFilter?.selectedValues).toEqual(['en-US']);
      expect(statusFilter?.selectedValues).toEqual(['up-to-date']);
    });

    it('should include input filters in emission after debounce', () => {
      vi.useFakeTimers();
      fixture.componentRef.setInput('activeFilters', [{ field: 'locale', list: ['en-US'] }]);

      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      component['onSelectionChange']('localizedStatus', ['up-to-date']);
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      expect(emitted).toContainEqual({ field: 'locale', list: ['en-US'] });
      expect(emitted).toContainEqual({ field: 'localizedStatus', list: ['up-to-date'] });
    });

    it('should emit without the removed filter when it came from activeFilters input', () => {
      vi.useFakeTimers();
      fixture.componentRef.setInput('activeFilters', [
        { field: 'locale', list: ['en-US'] },
        { field: 'jobStatus', list: ['active'] },
      ]);

      const emitSpy = vi.fn();
      component.filtersChanged.subscribe(emitSpy);

      // Remove the non-default filter that was provided via input
      component['onFilterRemoved']('jobStatus');
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emitted: ViewFilter[] = emitSpy.mock.calls[0][0];
      expect(emitted.find((f) => f.field === 'jobStatus')).toBeUndefined();
      expect(emitted).toContainEqual({ field: 'locale', list: ['en-US'] });
    });
  });
});
