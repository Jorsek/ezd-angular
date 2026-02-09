import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { CurrentViewService } from '../current-view.service';
import { InsightsViewRequest, InsightsView } from '../insights-views.models';
import { ViewsService } from '../views.service';
import { ViewSectionComponent } from './view-section.component';
import { PopupService } from '../../ccms-popup';

describe('ViewSectionComponent', () => {
  let component: ViewSectionComponent;
  let fixture: ComponentFixture<ViewSectionComponent>;
  let currentViewService: CurrentViewService;
  let mockViewsService: {
    get: ReturnType<typeof vi.fn>;
  };
  let mockPopupService: { open: ReturnType<typeof vi.fn>; popup: ReturnType<typeof signal<null>> };

  const mockDefaultView: InsightsView = {
    id: 'default-view-id',
    insightType: 'CONTENT',
    name: 'Default View',
    description: 'The default view',
    shared: true,
    readOnly: true,
    callouts: ['callout1'],
    charts: [{ id: 'chart-1', type: 'pie', field: 'status' }],
    columns: [{ field: 'title' }],
    filters: [],
    sorts: [{ field: 'title', ascending: true }],
  };

  const mockSavedView: InsightsView = {
    id: 'saved-view-id',
    insightType: 'CONTENT',
    name: 'My Custom View',
    description: 'A custom view',
    shared: false,
    callouts: ['custom-callout'],
    charts: [{ id: 'chart-2', type: 'bar', field: 'language' }],
    columns: [{ field: 'author' }],
    filters: [{ field: 'status', value: 'draft' }],
    sorts: [{ field: 'date', ascending: false }],
  };

  beforeEach(async () => {
    mockViewsService = {
      get: vi.fn().mockReturnValue(of([mockDefaultView, mockSavedView])),
    };

    mockPopupService = {
      open: vi.fn(),
      popup: signal(null),
    };

    // Create a real CurrentViewService instance and configure it
    // (In production, ccms-report does this before rendering view-section)
    currentViewService = new CurrentViewService();
    currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
    currentViewService.setView(mockDefaultView);

    await TestBed.configureTestingModule({
      imports: [ViewSectionComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CurrentViewService, useValue: currentViewService },
        { provide: ViewsService, useValue: mockViewsService },
      ],
    })
      .overrideComponent(ViewSectionComponent, {
        set: {
          providers: [{ provide: PopupService, useValue: mockPopupService }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ViewSectionComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('views', [mockDefaultView, mockSavedView]);
    fixture.componentRef.setInput('insightType', 'CONTENT');
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should have views from input', () => {
      expect(component.views()).toHaveLength(2);
    });

    it('should build viewsMap for quick lookup', () => {
      const viewsMap = component['viewsMap']();
      expect(viewsMap.get('default-view-id')).toEqual(mockDefaultView);
      expect(viewsMap.get('saved-view-id')).toEqual(mockSavedView);
    });
  });

  describe('showViewSection', () => {
    it('should return true when there are multiple views', () => {
      expect(component['showViewSection']()).toBe(true);
    });

    it('should return true when allowUserViews is true even with single view', () => {
      fixture.componentRef.setInput('views', [mockDefaultView]);
      fixture.componentRef.setInput('allowUserViews', true);
      fixture.detectChanges();

      expect(component['showViewSection']()).toBe(true);
    });

    it('should return false when single view and allowUserViews is false', () => {
      fixture.componentRef.setInput('views', [mockDefaultView]);
      fixture.componentRef.setInput('allowUserViews', false);
      fixture.detectChanges();

      expect(component['showViewSection']()).toBe(false);
    });
  });

  describe('selectedViewDescription', () => {
    beforeEach(() => {
      currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
      fixture.detectChanges();
    });

    it('should return description of current view from service', () => {
      const desc = component['selectedViewDescription']();
      expect(desc.id).toBe('default-view-id');
      expect(desc.name).toBe('Default View');
    });

    it('should update when service view changes', () => {
      currentViewService.setView(mockSavedView);

      const desc = component['selectedViewDescription']();
      expect(desc.id).toBe('saved-view-id');
      expect(desc.name).toBe('My Custom View');
    });
  });

  describe('viewEditable', () => {
    beforeEach(() => {
      currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
      fixture.detectChanges();
    });

    it('should return false for readOnly views', () => {
      // Default view is readOnly
      expect(component['viewEditable']()).toBe(false);
    });

    it('should return true for non-readOnly views', () => {
      currentViewService.setView(mockSavedView);
      expect(component['viewEditable']()).toBe(true);
    });
  });

  describe('onViewChange', () => {
    beforeEach(() => {
      currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
      fixture.detectChanges();
    });

    it('should emit viewChange with full view when view is selected', () => {
      const emitSpy = vi.spyOn(component.viewChange, 'emit');

      component['onViewChange']({ id: 'saved-view-id', name: 'My Custom View', description: '' });

      expect(emitSpy).toHaveBeenCalledWith(mockSavedView);
    });

    it('should not emit if view not found in map', () => {
      const emitSpy = vi.spyOn(component.viewChange, 'emit');

      component['onViewChange']({ id: 'unknown-id', name: 'Unknown', description: '' });

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onUpdateView', () => {
    beforeEach(() => {
      currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
      fixture.detectChanges();
    });

    it('should not emit when current view is readOnly', () => {
      const emitSpy = vi.spyOn(component.updateView, 'emit');

      component['onUpdateView']();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit updateView with current view data when not readOnly', () => {
      currentViewService.setView(mockSavedView);
      const emitSpy = vi.spyOn(component.updateView, 'emit');

      component['onUpdateView']();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'saved-view-id',
          name: 'My Custom View',
          columns: [{ field: 'author' }],
        }),
      );
    });

    it('should include all view properties in update request', () => {
      currentViewService.setView(mockSavedView);
      const emitSpy = vi.spyOn(component.updateView, 'emit');

      component['onUpdateView']();

      const emittedRequest = emitSpy.mock.calls[0][0] as InsightsViewRequest;
      expect(emittedRequest.id).toBe('saved-view-id');
      expect(emittedRequest.name).toBe('My Custom View');
      expect(emittedRequest.description).toBe('A custom view');
      expect(emittedRequest.shared).toBe(false);
      expect(emittedRequest.columns).toEqual([{ field: 'author' }]);
      expect(emittedRequest.filters).toEqual([{ field: 'status', value: 'draft' }]);
      expect(emittedRequest.sorts).toEqual([{ field: 'date', ascending: false }]);
      expect(emittedRequest.charts).toEqual([{ id: 'chart-2', type: 'bar', field: 'language' }]);
      expect(emittedRequest.callouts).toEqual(['custom-callout']);
    });
  });

  describe('onCreateView', () => {
    beforeEach(() => {
      currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
      fixture.detectChanges();
    });

    it('should open save view dialog', () => {
      component['onCreateView']();

      expect(mockPopupService.open).toHaveBeenCalled();
    });

    it('should emit saveView with current state when dialog returns save action', () => {
      const emitSpy = vi.spyOn(component.saveView, 'emit');

      // Set up some state in the service
      currentViewService.setColumns([{ field: 'newCol' }]);
      currentViewService.setFilters([{ field: 'status', value: 'active' }]);

      component['onCreateView']();

      // Get the callback from the mock call
      const callback = mockPopupService.open.mock.calls[0][2];
      callback({ action: 'save', name: 'New View', description: 'A new view' });

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New View',
          description: 'A new view',
          shared: false,
          columns: [{ field: 'newCol' }],
          filters: [{ field: 'status', value: 'active' }],
        }),
      );
    });

    it('should not emit saveView when dialog is cancelled', () => {
      const emitSpy = vi.spyOn(component.saveView, 'emit');

      component['onCreateView']();

      const callback = mockPopupService.open.mock.calls[0][2];
      callback(undefined);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit saveView when action is save but name is missing', () => {
      const emitSpy = vi.spyOn(component.saveView, 'emit');

      component['onCreateView']();

      const callback = mockPopupService.open.mock.calls[0][2];
      callback({ action: 'save', name: '', description: '' });

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onEditView', () => {
    beforeEach(() => {
      currentViewService.configure('CONTENT', [mockDefaultView, mockSavedView]);
      fixture.detectChanges();
    });

    it('should not open dialog when current view is readOnly', () => {
      component['onEditView']({ id: 'default-view-id', name: 'Default View', description: '' });

      expect(mockPopupService.open).not.toHaveBeenCalled();
    });

    it('should open dialog with current view data when not readOnly', () => {
      currentViewService.setView(mockSavedView);

      component['onEditView']({ id: 'saved-view-id', name: 'My Custom View', description: '' });

      expect(mockPopupService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          view: expect.objectContaining({ id: 'saved-view-id', name: 'My Custom View' }),
          insightType: 'CONTENT',
        }),
        expect.any(Function),
      );
    });

    it('should emit deleteView when dialog returns delete action', () => {
      currentViewService.setView(mockSavedView);
      const emitSpy = vi.spyOn(component.deleteView, 'emit');

      component['onEditView']({ id: 'saved-view-id', name: 'My Custom View', description: '' });

      const callback = mockPopupService.open.mock.calls[0][2];
      callback({ action: 'delete' });

      expect(emitSpy).toHaveBeenCalledWith('saved-view-id');
    });

    it('should emit updateView when dialog returns save action', () => {
      currentViewService.setView(mockSavedView);
      const emitSpy = vi.spyOn(component.updateView, 'emit');

      component['onEditView']({ id: 'saved-view-id', name: 'My Custom View', description: '' });

      const callback = mockPopupService.open.mock.calls[0][2];
      callback({ action: 'save', name: 'Renamed View', description: 'Updated desc' });

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'saved-view-id',
          name: 'Renamed View',
          description: 'Updated desc',
        }),
      );
    });

    it('should not emit when dialog is cancelled', () => {
      currentViewService.setView(mockSavedView);
      const updateSpy = vi.spyOn(component.updateView, 'emit');
      const deleteSpy = vi.spyOn(component.deleteView, 'emit');

      component['onEditView']({ id: 'saved-view-id', name: 'My Custom View', description: '' });

      const callback = mockPopupService.open.mock.calls[0][2];
      callback(undefined);

      expect(updateSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
