import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ViewMenuComponent, ViewDescription } from './view-menu.component';

describe('ViewMenuComponent', () => {
  let component: ViewMenuComponent;
  let fixture: ComponentFixture<ViewMenuComponent>;

  const mockViews: ViewDescription[] = [
    { id: '1', name: 'All Resources', description: 'Shows all resources' },
    { id: '2', name: 'Needs Translation', description: 'Resources needing translation' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMenuComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMenuComponent);
    component = fixture.componentInstance;
  });

  describe('loading state', () => {
    it('should show skeleton when loading is true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.ccms-view-menu__skeleton');
      expect(skeleton).not.toBeNull();
    });

    it('should show skeleton label with "View" text', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.ccms-view-menu__skeleton-label');
      expect(label.textContent.trim()).toBe('View');
    });

    it('should not show trigger button while loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('.ccms-view-menu__trigger');
      expect(trigger).toBeNull();
    });
  });

  describe('loaded state', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockViews);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
    });

    it('should show trigger button when not loading', () => {
      const trigger = fixture.nativeElement.querySelector('.ccms-view-menu__trigger');
      expect(trigger).not.toBeNull();
    });

    it('should show "View" label in trigger', () => {
      const label = fixture.nativeElement.querySelector('.ccms-view-menu__label');
      expect(label.textContent.trim()).toBe('View');
    });

    it('should show "Select View" when no view is selected', () => {
      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.textContent.trim()).toBe('Select View');
    });

    it('should not have active class when no view is selected', () => {
      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.classList.contains('ccms-view-menu__selected--active')).toBe(false);
    });

    it('should not show skeleton when not loading', () => {
      const skeleton = fixture.nativeElement.querySelector('.ccms-view-menu__skeleton');
      expect(skeleton).toBeNull();
    });

    it('should render popup menu component', () => {
      const popupMenu = fixture.nativeElement.querySelector('ccms-popup-menu');
      expect(popupMenu).not.toBeNull();
    });
  });

  describe('view selection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockViews);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
    });

    it('should emit viewChanged when view is selected', () => {
      const viewChangedSpy = vi.spyOn(component.viewChanged, 'emit');
      component['onViewSelected'](mockViews[0]);
      expect(viewChangedSpy).toHaveBeenCalledWith(mockViews[0]);
    });

    it('should update selectedView signal when view is selected', () => {
      component['onViewSelected'](mockViews[0]);
      expect(component['selectedView']()).toEqual(mockViews[0]);
    });

    it('should display selected view name in trigger', () => {
      component['onViewSelected'](mockViews[0]);
      fixture.detectChanges();

      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.textContent.trim()).toBe('All Resources');
    });

    it('should add active class when view is selected', () => {
      component['onViewSelected'](mockViews[0]);
      fixture.detectChanges();

      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.classList.contains('ccms-view-menu__selected--active')).toBe(true);
    });
  });

  describe('edit view', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockViews);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
    });

    it('should emit editView when onEditView is called', () => {
      const editViewSpy = vi.spyOn(component.editView, 'emit');
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      component['onEditView'](mockEvent, mockViews[0]);

      expect(editViewSpy).toHaveBeenCalledWith(mockViews[0]);
    });

    it('should stop propagation when onEditView is called', () => {
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      component['onEditView'](mockEvent, mockViews[0]);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('loading transition', () => {
    it('should transition from loading to loaded when loading becomes false', () => {
      fixture.componentRef.setInput('items', mockViews);
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      // Initially loading
      let skeleton = fixture.nativeElement.querySelector('.ccms-view-menu__skeleton');
      expect(skeleton).not.toBeNull();

      // Set loading to false
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      // Now loaded
      skeleton = fixture.nativeElement.querySelector('.ccms-view-menu__skeleton');
      const trigger = fixture.nativeElement.querySelector('.ccms-view-menu__trigger');
      expect(skeleton).toBeNull();
      expect(trigger).not.toBeNull();
    });
  });

  describe('default state', () => {
    it('should not show skeleton by default (loading defaults to false)', () => {
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.ccms-view-menu__skeleton');
      expect(skeleton).toBeNull();
    });
  });

  describe('selected input', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockViews);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
    });

    it('should display selected view name when selected input is set', () => {
      fixture.componentRef.setInput('selected', mockViews[0]);
      fixture.detectChanges();

      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.textContent.trim()).toBe('All Resources');
    });

    it('should have active class when selected input is set', () => {
      fixture.componentRef.setInput('selected', mockViews[0]);
      fixture.detectChanges();

      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.classList.contains('ccms-view-menu__selected--active')).toBe(true);
    });

    it('should update display when selected input changes', () => {
      fixture.componentRef.setInput('selected', mockViews[0]);
      fixture.detectChanges();

      let selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.textContent.trim()).toBe('All Resources');

      fixture.componentRef.setInput('selected', mockViews[1]);
      fixture.detectChanges();

      selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.textContent.trim()).toBe('Needs Translation');
    });

    it('should show "Select View" when selected input is null', () => {
      fixture.componentRef.setInput('selected', null);
      fixture.detectChanges();

      const selected = fixture.nativeElement.querySelector('.ccms-view-menu__selected');
      expect(selected.textContent.trim()).toBe('Select View');
    });
  });
});
