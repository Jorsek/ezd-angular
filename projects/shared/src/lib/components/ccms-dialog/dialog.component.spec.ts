import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DialogButton, DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;

  const mockButtons: DialogButton[] = [
    { label: 'Cancel', type: 'default', onClick: vi.fn() },
    { label: 'Save', type: 'action', onClick: vi.fn() },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should display the title', () => {
      fixture.componentRef.setInput('title', 'Test Title');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.ccms-dialog__title');
      expect(title.textContent).toBe('Test Title');
    });

    it('should display the description when provided', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('description', 'Test description');
      fixture.detectChanges();

      const description = fixture.nativeElement.querySelector('.ccms-dialog__description');
      expect(description.textContent).toBe('Test description');
    });

    it('should not display description element when not provided', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      const description = fixture.nativeElement.querySelector('.ccms-dialog__description');
      expect(description).toBeNull();
    });

    it('should render buttons', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', mockButtons);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.ccms-dialog__button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent.trim()).toBe('Cancel');
      expect(buttons[1].textContent.trim()).toBe('Save');
    });

    it('should not render actions footer when no buttons', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', []);
      fixture.detectChanges();

      const actions = fixture.nativeElement.querySelector('.ccms-dialog__actions');
      expect(actions).toBeNull();
    });
  });

  describe('button types', () => {
    it('should apply action class to action buttons', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Save', type: 'action', onClick: vi.fn() },
      ]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.ccms-dialog__button');
      expect(button.classList.contains('ccms-dialog__button--action')).toBe(true);
    });

    it('should apply danger class to danger buttons', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Delete', type: 'danger', onClick: vi.fn() },
      ]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.ccms-dialog__button');
      expect(button.classList.contains('ccms-dialog__button--danger')).toBe(true);
    });

    it('should not apply special class to default buttons', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Cancel', type: 'default', onClick: vi.fn() },
      ]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.ccms-dialog__button');
      expect(button.classList.contains('ccms-dialog__button--action')).toBe(false);
      expect(button.classList.contains('ccms-dialog__button--danger')).toBe(false);
    });

    it('should disable button when disabled is true', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Save', type: 'action', onClick: vi.fn(), disabled: true },
      ]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.ccms-dialog__button');
      expect(button.disabled).toBe(true);
    });
  });

  describe('button clicks', () => {
    it('should call onClick when button is clicked', () => {
      const onClickSpy = vi.fn();
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Save', type: 'action', onClick: onClickSpy },
      ]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.ccms-dialog__button');
      button.click();

      expect(onClickSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should call action button onClick when Enter is pressed', () => {
      const actionSpy = vi.fn();
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Cancel', type: 'default', onClick: vi.fn() },
        { label: 'Save', type: 'action', onClick: actionSpy },
      ]);
      fixture.detectChanges();

      // Dispatch on host element where the host binding listens
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      fixture.nativeElement.dispatchEvent(event);

      expect(actionSpy).toHaveBeenCalled();
    });

    it('should not call action button onClick when Enter is pressed and button is disabled', () => {
      const actionSpy = vi.fn();
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Save', type: 'action', onClick: actionSpy, disabled: true },
      ]);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      fixture.nativeElement.dispatchEvent(event);

      expect(actionSpy).not.toHaveBeenCalled();
    });

    it('should emit escapePressed when Escape is pressed', () => {
      const escapeSpy = vi.spyOn(component.escapePressed, 'emit');
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      fixture.nativeElement.dispatchEvent(event);

      expect(escapeSpy).toHaveBeenCalled();
    });
  });

  describe('content projection', () => {
    it('should render projected content', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('.ccms-dialog__content');
      expect(content).not.toBeNull();
    });
  });

  describe('close button', () => {
    it('should not show close button by default', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('.ccms-dialog__close');
      expect(closeButton).toBeNull();
    });

    it('should show close button when showCloseButton is true', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('showCloseButton', true);
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('.ccms-dialog__close');
      expect(closeButton).not.toBeNull();
    });

    it('should emit escapePressed when close button is clicked', () => {
      const escapeSpy = vi.spyOn(component.escapePressed, 'emit');
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('showCloseButton', true);
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('.ccms-dialog__close');
      closeButton.click();

      expect(escapeSpy).toHaveBeenCalled();
    });
  });

  describe('button positioning', () => {
    it('should place danger buttons on the left', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Delete', type: 'danger', onClick: vi.fn() },
        { label: 'Cancel', type: 'default', onClick: vi.fn() },
      ]);
      fixture.detectChanges();

      const leftButtons = fixture.nativeElement.querySelectorAll(
        '.ccms-dialog__actions-left .ccms-dialog__button',
      );
      const rightButtons = fixture.nativeElement.querySelectorAll(
        '.ccms-dialog__actions-right .ccms-dialog__button',
      );

      expect(leftButtons.length).toBe(1);
      expect(leftButtons[0].textContent.trim()).toBe('Delete');
      expect(rightButtons.length).toBe(1);
      expect(rightButtons[0].textContent.trim()).toBe('Cancel');
    });

    it('should place action buttons on the right', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('buttons', [
        { label: 'Delete', type: 'danger', onClick: vi.fn() },
        { label: 'Cancel', type: 'default', onClick: vi.fn() },
        { label: 'Save', type: 'action', onClick: vi.fn() },
      ]);
      fixture.detectChanges();

      const rightButtons = fixture.nativeElement.querySelectorAll(
        '.ccms-dialog__actions-right .ccms-dialog__button',
      );

      expect(rightButtons.length).toBe(2);
      expect(rightButtons[0].textContent.trim()).toBe('Cancel');
      expect(rightButtons[1].textContent.trim()).toBe('Save');
    });
  });
});
