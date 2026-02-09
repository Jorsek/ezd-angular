import { TestBed } from '@angular/core/testing';
import { CurrentViewService } from './current-view.service';
import { InsightsView } from './insights-views.models';

describe('CurrentViewService', () => {
  let service: CurrentViewService;
  let mockDefaultView: InsightsView;
  let mockSavedView: InsightsView;

  function createMockDefaultView(): InsightsView {
    return {
      id: 'default-view-id',
      insightType: 'CONTENT',
      name: 'Default View',
      description: 'The default view',
      shared: true,
      readOnly: true,
      callouts: ['callout1', 'callout2'],
      charts: [{ id: 'chart-1', type: 'pie', field: 'status' }],
      columns: [{ field: 'title' }, { field: 'author' }],
      filters: [{ field: 'status', value: 'published' }],
      sorts: [{ field: 'title', ascending: true }],
    };
  }

  function createMockSavedView(): InsightsView {
    return {
      id: 'saved-view-id',
      insightType: 'CONTENT',
      name: 'My Custom View',
      description: 'A custom view',
      shared: false,
      callouts: ['custom-callout'],
      charts: [{ id: 'chart-2', type: 'bar', field: 'language' }],
      columns: [{ field: 'title' }],
      filters: [],
      sorts: [{ field: 'date', ascending: false }],
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentViewService],
    });
    service = TestBed.inject(CurrentViewService);
    mockDefaultView = createMockDefaultView();
    mockSavedView = createMockSavedView();
  });

  describe('before configuration', () => {
    it('should throw when accessing insightType before configure', () => {
      expect(() => service.insightType()).toThrow();
    });

    it('should throw when accessing view before configure', () => {
      expect(() => service.view()).toThrow();
    });

    it('should not be initialized', () => {
      expect(service.initialized()).toBe(false);
    });

    it('should not throw when calling setView before configure (no-op)', () => {
      expect(() => service.setView(mockDefaultView)).not.toThrow();
    });

    it('should not throw when calling setColumns before configure (no-op)', () => {
      expect(() => service.setColumns([])).not.toThrow();
    });

    it('should not throw when calling reset before configure (no-op)', () => {
      expect(() => service.reset()).not.toThrow();
    });
  });

  describe('configure', () => {
    it('should initialize with the provided type and views', () => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);

      expect(service.insightType()).toBe('CONTENT');
      expect(service.initialized()).toBe(true);
      // Note: view() throws until setView() is called
    });

    it('should allow setView after configure', () => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);
      service.setView(mockDefaultView);

      expect(service.view().name).toBe('Default View');
      expect(service.dirty()).toBe(false);
    });

    it('should create a deep copy when setView is called', () => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);

      // Mutating original should not affect service
      mockDefaultView.columns.push({ field: 'mutated' });

      expect(service.columns()).toHaveLength(2);
      expect(service.columns().find((c) => c.field === 'mutated')).toBeUndefined();
    });

    it('should not throw when configured twice (updates views list)', () => {
      service.configure('CONTENT', [mockDefaultView]);

      expect(() => service.configure('CONTENT', [mockDefaultView, mockSavedView])).not.toThrow();
    });

    it('should preserve current view when configured again', () => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);
      service.setView(mockSavedView);

      // Re-configure with updated views list
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);

      // Should still have the saved view as current
      expect(service.view().name).toBe('My Custom View');
    });

    it('should do nothing when configured with empty views', () => {
      service.configure('CONTENT', []);

      expect(service.initialized()).toBe(false);
    });
  });

  describe('reactive getters', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should expose columns reactively', () => {
      expect(service.columns()).toEqual([{ field: 'title' }, { field: 'author' }]);
    });

    it('should expose filters reactively', () => {
      expect(service.filters()).toHaveLength(1);
      expect(service.filters()[0].field).toBe('status');
    });

    it('should expose sorts reactively', () => {
      expect(service.sorts()).toEqual([{ field: 'title', ascending: true }]);
    });

    it('should expose charts reactively', () => {
      expect(service.charts()).toEqual([{ id: 'chart-1', type: 'pie', field: 'status' }]);
    });

    it('should expose callouts reactively', () => {
      expect(service.callouts()).toEqual(['callout1', 'callout2']);
    });
  });

  describe('setView', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);
      service.setView(mockDefaultView);
    });

    it('should update the current view', () => {
      service.setView(mockSavedView);

      expect(service.view().name).toBe('My Custom View');
      expect(service.view().id).toBe('saved-view-id');
    });

    it('should reset dirty flag after setView', () => {
      service.setColumns([{ field: 'new' }]);
      expect(service.dirty()).toBe(true);

      service.setView(mockSavedView);
      expect(service.dirty()).toBe(false);
    });

    it('should create a deep copy of the provided view', () => {
      service.setView(mockSavedView);

      // Mutating original should not affect service
      mockSavedView.columns.push({ field: 'mutated' });

      expect(service.columns()).toHaveLength(1);
    });
  });

  describe('setColumns', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should update columns', () => {
      service.setColumns([{ field: 'newCol1' }, { field: 'newCol2' }]);

      expect(service.columns()).toEqual([{ field: 'newCol1' }, { field: 'newCol2' }]);
    });

    it('should mark view as dirty', () => {
      expect(service.dirty()).toBe(false);

      service.setColumns([{ field: 'newCol' }]);

      expect(service.dirty()).toBe(true);
    });

    it('should not mutate the input array', () => {
      const input = [{ field: 'col1' }];
      service.setColumns(input);

      input.push({ field: 'col2' });

      expect(service.columns()).toHaveLength(1);
    });
  });

  describe('setFilters', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should update filters', () => {
      const newFilters = [{ field: 'author', value: 'john' }];
      service.setFilters(newFilters);

      expect(service.filters()).toHaveLength(1);
      expect(service.filters()[0].field).toBe('author');
    });

    it('should mark view as dirty', () => {
      service.setFilters([]);

      expect(service.dirty()).toBe(true);
    });
  });

  describe('setSorts', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should update sorts', () => {
      service.setSorts([{ field: 'date', ascending: false }]);

      expect(service.sorts()).toEqual([{ field: 'date', ascending: false }]);
    });

    it('should mark view as dirty', () => {
      service.setSorts([]);

      expect(service.dirty()).toBe(true);
    });
  });

  describe('setCharts', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should update charts', () => {
      service.setCharts([{ id: 'new-chart', type: 'bar', field: 'language' }]);

      expect(service.charts()).toEqual([{ id: 'new-chart', type: 'bar', field: 'language' }]);
    });

    it('should mark view as dirty', () => {
      service.setCharts([]);

      expect(service.dirty()).toBe(true);
    });
  });

  describe('setCallouts', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should update callouts', () => {
      service.setCallouts(['new-callout']);

      expect(service.callouts()).toEqual(['new-callout']);
    });

    it('should mark view as dirty', () => {
      service.setCallouts([]);

      expect(service.dirty()).toBe(true);
    });

    it('should not mutate the input array', () => {
      const input = ['callout1'];
      service.setCallouts(input);

      input.push('callout2');

      expect(service.callouts()).toHaveLength(1);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);
      service.setView(mockDefaultView);
    });

    it('should reset to the default view', () => {
      service.setView(mockSavedView);
      expect(service.view().name).toBe('My Custom View');

      service.reset();

      expect(service.view().name).toBe('Default View');
    });

    it('should clear dirty flag', () => {
      service.setColumns([{ field: 'modified' }]);
      expect(service.dirty()).toBe(true);

      service.reset();

      expect(service.dirty()).toBe(false);
    });

    it('should restore original default view columns', () => {
      service.setColumns([{ field: 'modified' }]);

      service.reset();

      expect(service.columns()).toEqual([{ field: 'title' }, { field: 'author' }]);
    });
  });

  describe('dirty tracking', () => {
    beforeEach(() => {
      service.configure('CONTENT', [mockDefaultView]);
      service.setView(mockDefaultView);
    });

    it('should not be dirty after configure', () => {
      expect(service.dirty()).toBe(false);
    });

    it('should be dirty after modifying columns', () => {
      service.setColumns([]);
      expect(service.dirty()).toBe(true);
    });

    it('should be dirty after modifying filters', () => {
      service.setFilters([]);
      expect(service.dirty()).toBe(true);
    });

    it('should be dirty after modifying sorts', () => {
      service.setSorts([]);
      expect(service.dirty()).toBe(true);
    });

    it('should be dirty after modifying charts', () => {
      service.setCharts([]);
      expect(service.dirty()).toBe(true);
    });

    it('should be dirty after modifying callouts', () => {
      service.setCallouts([]);
      expect(service.dirty()).toBe(true);
    });

    it('should not be dirty after setView', () => {
      service.setColumns([]);
      expect(service.dirty()).toBe(true);

      service.setView(mockSavedView);
      expect(service.dirty()).toBe(false);
    });

    it('should not be dirty after reset', () => {
      service.setColumns([]);
      expect(service.dirty()).toBe(true);

      service.reset();
      expect(service.dirty()).toBe(false);
    });
  });

  describe('defaultView', () => {
    it('should return the first view in the list', () => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);
      service.setView(mockDefaultView);

      expect(service.defaultView()).toEqual(mockDefaultView);
    });

    it('should throw if not configured', () => {
      expect(() => service.defaultView()).toThrow();
    });
  });

  describe('allViews', () => {
    it('should return all configured views', () => {
      service.configure('CONTENT', [mockDefaultView, mockSavedView]);

      expect(service.allViews()).toHaveLength(2);
      expect(service.allViews()[0].name).toBe('Default View');
      expect(service.allViews()[1].name).toBe('My Custom View');
    });

    it('should return empty array if not configured', () => {
      expect(service.allViews()).toEqual([]);
    });
  });
});
