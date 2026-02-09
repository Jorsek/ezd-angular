import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FilterComponent } from './filter';
import { PopupMenuComponent } from '../../ccms-popup-menu';

describe('FilterComponent', () => {
  describe('standalone', () => {
    let component: FilterComponent;
    let fixture: ComponentFixture<FilterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FilterComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(FilterComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('label', 'Test Label');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display label', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Test Label');
    });

    it('should show chevron when expandable is true', () => {
      fixture.componentRef.setInput('expandable', true);
      fixture.detectChanges();

      const chevron = fixture.nativeElement.querySelector('.filter-chevron');
      expect(chevron).toBeTruthy();
    });

    it('should hide chevron when expandable is false', () => {
      fixture.componentRef.setInput('expandable', false);
      fixture.detectChanges();

      const chevron = fixture.nativeElement.querySelector('.filter-chevron');
      expect(chevron).toBeNull();
    });

    it('should show remove button when removable is true', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      expect(removeBtn).toBeTruthy();
    });

    it('should hide remove button when removable is false', () => {
      fixture.componentRef.setInput('removable', false);
      fixture.detectChanges();

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      expect(removeBtn).toBeNull();
    });

    it('should emit removed when remove button clicked', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const removedSpy = vi.fn();
      component.removed.subscribe(removedSpy);

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      removeBtn.click();

      expect(removedSpy).toHaveBeenCalled();
    });

    it('should stop propagation when remove button clicked', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const hostClickSpy = vi.fn();
      fixture.nativeElement.addEventListener('click', hostClickSpy);

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      removeBtn.click();

      // The click should not propagate to the host
      expect(hostClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('with projected content', () => {
    let fixture: ComponentFixture<DropdownHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DropdownHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(DropdownHostComponent);
      fixture.detectChanges();
    });

    it('should show label', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Status');
    });

    it('should project value content', () => {
      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl).toBeTruthy();
      expect(valueEl.textContent).toContain('Active');
    });

    it('should show chevron when expandable', () => {
      const chevron = fixture.nativeElement.querySelector('.filter-chevron');
      expect(chevron).toBeTruthy();
    });
  });

  describe('inline mode (no expandable)', () => {
    let fixture: ComponentFixture<InlineHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [InlineHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(InlineHostComponent);
      fixture.detectChanges();
    });

    it('should show label and projected input', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Search');

      const input = fixture.nativeElement.querySelector('input');
      expect(input).toBeTruthy();
    });

    it('should not show chevron', () => {
      const chevron = fixture.nativeElement.querySelector('.filter-chevron');
      expect(chevron).toBeNull();
    });
  });

  describe('content projection with popup menu', () => {
    let fixture: ComponentFixture<PopupMenuHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PopupMenuHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(PopupMenuHostComponent);
      fixture.detectChanges();
    });

    it('should project popup menu as sibling to other content', () => {
      const popupMenu = fixture.nativeElement.querySelector('ccms-popup-menu');
      expect(popupMenu).toBeTruthy();

      const valueEl = fixture.nativeElement.querySelector('.filter-value');
      expect(valueEl).toBeTruthy();
    });
  });
});

@Component({
  selector: 'app-dropdown-host',
  imports: [FilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-filter [label]="'Status'" [expandable]="true" [removable]="true">
      <span class="filter-value">Active</span>
    </ccms-filter>
  `,
})
class DropdownHostComponent {}

@Component({
  selector: 'app-inline-host',
  imports: [FilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-filter [label]="'Search'" [removable]="false">
      <input type="text" placeholder="Enter text..." />
    </ccms-filter>
  `,
})
class InlineHostComponent {}

@Component({
  selector: 'app-popup-menu-host',
  imports: [FilterComponent, PopupMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-filter [label]="'Type'" [expandable]="true">
      <span class="filter-value">All</span>
      <ccms-popup-menu></ccms-popup-menu>
    </ccms-filter>
  `,
})
class PopupMenuHostComponent {}
