import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ViewActionsComponent } from './view-actions.component';
import { InsightsView } from '../insights-views.models';

describe('ViewActionsComponent', () => {
  let component: ViewActionsComponent;
  let fixture: ComponentFixture<ViewActionsComponent>;

  const mockView: InsightsView = {
    id: 'test-view-id',
    name: 'Test View',
    description: 'A test view',
    insightType: 'LOCALIZATION',
    shared: false,
    callouts: [],
    columns: [],
    filters: [],
    sorts: [],
    charts: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewActionsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('when no view is selected', () => {
    it('should show only "Save as new View" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent.trim()).toBe('Save as new View');
    });

    it('should emit createView when "Save as new View" clicked', () => {
      const createSpy = vi.spyOn(component.createView, 'emit');
      const button = fixture.nativeElement.querySelector('.ccms-view-actions__button');
      button.click();
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('when view is selected but not dirty', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('view', mockView);
      fixture.componentRef.setInput('dirty', false);
      fixture.detectChanges();
    });

    it('should show only "Save as new View" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent.trim()).toBe('Save as new View');
    });

    it('should not show "Save Changes" button', () => {
      const primaryButton = fixture.nativeElement.querySelector(
        '.ccms-view-actions__button--primary',
      );
      expect(primaryButton).toBeNull();
    });
  });

  describe('when view is selected and dirty', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('view', mockView);
      fixture.componentRef.setInput('dirty', true);
      fixture.componentRef.setInput('editable', true);
      fixture.detectChanges();
    });

    it('should show both buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      expect(buttons.length).toBe(2);
    });

    it('should show "Save Changes" as primary button', () => {
      const primaryButton = fixture.nativeElement.querySelector(
        '.ccms-view-actions__button--primary',
      );
      expect(primaryButton).not.toBeNull();
      expect(primaryButton.textContent.trim()).toBe('Save Changes');
    });

    it('should show "Save as new View" as secondary button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      const secondaryButton = buttons[1];
      expect(secondaryButton.textContent.trim()).toBe('Save as new View');
    });

    it('should emit updateView with current view when "Save Changes" clicked', () => {
      const updateSpy = vi.spyOn(component.updateView, 'emit');
      const primaryButton = fixture.nativeElement.querySelector(
        '.ccms-view-actions__button--primary',
      );
      primaryButton.click();
      expect(updateSpy).toHaveBeenCalledWith(mockView);
    });

    it('should emit createView when "Save as new View" clicked', () => {
      const createSpy = vi.spyOn(component.createView, 'emit');
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      buttons[1].click();
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('when view is dirty but not editable', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('view', mockView);
      fixture.componentRef.setInput('dirty', true);
      fixture.componentRef.setInput('editable', false);
      fixture.detectChanges();
    });

    it('should not show "Save Changes" button', () => {
      const primaryButton = fixture.nativeElement.querySelector(
        '.ccms-view-actions__button--primary',
      );
      expect(primaryButton).toBeNull();
    });

    it('should show only "Save as new View" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent.trim()).toBe('Save as new View');
    });
  });

  describe('when showCreateButton is false', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('showCreateButton', false);
      fixture.detectChanges();
    });

    it('should not show "Save as new View" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
    });

    it('should show skeleton when loading is true', () => {
      const skeleton = fixture.nativeElement.querySelector('.ccms-view-actions__skeleton');
      expect(skeleton).not.toBeNull();
    });

    it('should not show any buttons when loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.ccms-view-actions__button');
      expect(buttons.length).toBe(0);
    });

    it('should hide skeleton when loading becomes false', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.ccms-view-actions__skeleton');
      expect(skeleton).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('hasView should return false when view is null', () => {
      fixture.componentRef.setInput('view', null);
      fixture.detectChanges();
      expect(component.hasView()).toBe(false);
    });

    it('hasView should return true when view is set', () => {
      fixture.componentRef.setInput('view', mockView);
      fixture.detectChanges();
      expect(component.hasView()).toBe(true);
    });
  });
});
