import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PopupService } from './popup.service';
import { PopupOutletComponent } from './popup-outlet.component';
import { PopupRef } from './popup-ref';
import { POPUP_REF, POPUP_DATA } from './popup.tokens';

@Component({
  selector: 'ccms-test-popup',
  template: `<div class="test-popup">{{ data.message }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestPopupComponent {
  popupRef = inject<PopupRef<string>>(POPUP_REF);
  data = inject<{ message: string }>(POPUP_DATA);

  close(result?: string): void {
    this.popupRef.close(result);
  }
}

@Component({
  selector: 'ccms-test-host',
  imports: [PopupOutletComponent],
  template: `
    <div class="host-container">
      <ccms-popup-outlet />
    </div>
  `,
  providers: [PopupService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  popupService = inject(PopupService);
}

describe('PopupService', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let popupService: PopupService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, TestPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    popupService = host.popupService;
    fixture.detectChanges();
  });

  it('should create service', () => {
    expect(popupService).toBeTruthy();
  });

  it('should start with no popup', () => {
    expect(popupService.popup()).toBeNull();
  });

  describe('open', () => {
    it('should open a popup', async () => {
      popupService.open(TestPopupComponent, { message: 'Hello' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(popupService.popup()).not.toBeNull();
      const popupEl = fixture.nativeElement.querySelector('.test-popup');
      expect(popupEl).toBeTruthy();
      expect(popupEl.textContent).toBe('Hello');
    });

    it('should close previous popup when opening a new one', async () => {
      const closedSpy = vi.fn();
      popupService.open(TestPopupComponent, { message: 'First' }, closedSpy);

      fixture.detectChanges();
      await fixture.whenStable();

      popupService.open(TestPopupComponent, { message: 'Second' });
      fixture.detectChanges();
      await fixture.whenStable();

      expect(closedSpy).toHaveBeenCalledWith(undefined);
    });

    it('should call onClose callback with result when popup closes', async () => {
      const closedSpy = vi.fn();
      popupService.open(TestPopupComponent, { message: 'Test' }, closedSpy);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const state = popupService.popup();
      expect(state).not.toBeNull();

      // Get the popup component and close it with a result
      const popupRef = state!.injector.get(POPUP_REF) as PopupRef<string>;
      popupRef.close('confirmed');

      expect(closedSpy).toHaveBeenCalledWith('confirmed');
    });

    it('should call onClose callback with undefined when closed without result', async () => {
      const closedSpy = vi.fn();
      popupService.open(TestPopupComponent, { message: 'Test' }, closedSpy);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const state = popupService.popup();
      const popupRef = state!.injector.get(POPUP_REF) as PopupRef<string>;
      popupRef.close();

      expect(closedSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('popup closing', () => {
    it('should close popup when close() is called on PopupRef', async () => {
      popupService.open(TestPopupComponent, { message: 'Test' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.test-popup')).toBeTruthy();

      const state = popupService.popup();
      const popupRef = state!.injector.get(POPUP_REF) as PopupRef<string>;
      popupRef.close();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(popupService.popup()).toBeNull();
    });

    it('should only close once even if close() called multiple times', async () => {
      const closedSpy = vi.fn();
      popupService.open(TestPopupComponent, { message: 'Test' }, closedSpy);
      fixture.detectChanges();
      await fixture.whenStable();

      const state = popupService.popup();
      const popupRef = state!.injector.get(POPUP_REF) as PopupRef<string>;

      popupRef.close('first');
      popupRef.close('second');

      expect(closedSpy).toHaveBeenCalledTimes(1);
      expect(closedSpy).toHaveBeenCalledWith('first');
    });
  });

  describe('injection tokens', () => {
    it('should inject POPUP_DATA into popup component', async () => {
      popupService.open(TestPopupComponent, { message: 'Injected Data' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const popupEl = fixture.nativeElement.querySelector('.test-popup');
      expect(popupEl.textContent).toBe('Injected Data');
    });

    it('should allow popup to close itself via injected POPUP_REF', async () => {
      const closedSpy = vi.fn();
      popupService.open(TestPopupComponent, { message: 'Test' }, closedSpy);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const state = popupService.popup();
      expect(state).not.toBeNull();

      const popupRef = state!.injector.get(POPUP_REF) as PopupRef<string>;
      popupRef.close('from-popup');

      expect(closedSpy).toHaveBeenCalledWith('from-popup');
    });
  });

  describe('backdrop', () => {
    it('should render backdrop when popup is open', async () => {
      popupService.open(TestPopupComponent, { message: 'Test' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.ccms-popup-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('should remove backdrop when popup is closed', async () => {
      popupService.open(TestPopupComponent, { message: 'Test' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const state = popupService.popup();
      const popupRef = state!.injector.get(POPUP_REF) as PopupRef<string>;
      popupRef.close();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.ccms-popup-backdrop');
      expect(backdrop).toBeFalsy();
    });
  });
});

describe('PopupRef (standalone)', () => {
  it('should complete afterClosed$ on close', () => {
    const ref = new PopupRef<string>();
    const completeSpy = vi.fn();

    ref.afterClosed$.subscribe({
      complete: completeSpy,
    });

    ref.close('done');

    expect(completeSpy).toHaveBeenCalled();
  });

  it('should call _destroy callback on close', () => {
    const ref = new PopupRef();
    const destroySpy = vi.fn();
    ref._destroy = destroySpy;

    ref.close();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('should handle _complete() for forced cleanup', () => {
    const ref = new PopupRef<string>();
    const nextSpy = vi.fn();
    const completeSpy = vi.fn();

    ref.afterClosed$.subscribe({
      next: nextSpy,
      complete: completeSpy,
    });

    ref._complete();

    expect(nextSpy).toHaveBeenCalledWith(undefined);
    expect(completeSpy).toHaveBeenCalled();
  });
});
