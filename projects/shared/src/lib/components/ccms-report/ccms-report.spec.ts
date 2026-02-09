import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { of } from 'rxjs';
import { CcmsReportComponent } from './ccms-report';
import { ViewsService } from '../insights-views';
import { NotificationService } from '../ccms-notifications';

describe('CcmsReportComponent', () => {
  const mockViewsService = {
    get: vi.fn(() => of([])),
    refresh: vi.fn(() => of([])),
    add: vi.fn(() => of({})),
    update: vi.fn(() => of({})),
    remove: vi.fn(() => of(undefined)),
    saveLastViewId: vi.fn(),
    getLastViewId: vi.fn(() => null),
  };

  const mockNotificationService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('minimum loading display time', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      vi.useFakeTimers();

      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: ViewsService, useValue: mockViewsService },
          { provide: NotificationService, useValue: mockNotificationService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show loading when loading input is true', () => {
      host.loading.set(true);
      fixture.detectChanges();

      expect(host.reportComponent()['isLoading']()).toBe(true);
    });

    it('should keep loading visible for minimum time even if loading finishes quickly', () => {
      // Start loading
      host.loading.set(true);
      fixture.detectChanges();
      expect(host.reportComponent()['isLoading']()).toBe(true);

      // Stop loading immediately
      host.loading.set(false);
      fixture.detectChanges();

      // Should still be loading due to minimum display time
      expect(host.reportComponent()['isLoading']()).toBe(true);

      // Wait for minimum display time (250ms)
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      // Now should be not loading
      expect(host.reportComponent()['isLoading']()).toBe(false);
    });

    it('should hide loading immediately if loading takes longer than minimum time', () => {
      // Start loading
      host.loading.set(true);
      fixture.detectChanges();

      // Wait longer than minimum time while still loading
      vi.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(host.reportComponent()['isLoading']()).toBe(true);

      // Stop loading - should hide immediately since minimum time already elapsed
      host.loading.set(false);
      fixture.detectChanges();

      expect(host.reportComponent()['isLoading']()).toBe(false);
    });

    it('should reset minimum time on new loading cycle', () => {
      // First loading cycle
      host.loading.set(true);
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      host.loading.set(false);
      fixture.detectChanges();
      expect(host.reportComponent()['isLoading']()).toBe(false);

      // Second loading cycle - should enforce minimum time again
      host.loading.set(true);
      fixture.detectChanges();
      host.loading.set(false);
      fixture.detectChanges();

      // Should still show loading due to minimum time
      expect(host.reportComponent()['isLoading']()).toBe(true);

      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(host.reportComponent()['isLoading']()).toBe(false);
    });

    it('should clean up timeout on destroy', () => {
      host.loading.set(true);
      fixture.detectChanges();

      // Destroy while loading
      fixture.destroy();

      // Should not throw when timeout would have fired
      vi.advanceTimersByTime(250);
    });
  });

  describe('loadingMessage', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: ViewsService, useValue: mockViewsService },
          { provide: NotificationService, useValue: mockNotificationService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show generic message when no title provided', () => {
      expect(host.reportComponent()['loadingMessage']()).toBe('Loading report...');
    });

    it('should show title-based message when title provided', () => {
      host.title.set('Content Insights');
      fixture.detectChanges();

      expect(host.reportComponent()['loadingMessage']()).toBe('Loading Content Insights...');
    });
  });

  describe('hasHeader', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: ViewsService, useValue: mockViewsService },
          { provide: NotificationService, useValue: mockNotificationService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should be false when showHeader is false (default)', () => {
      host.title.set('Some Title');
      fixture.detectChanges();

      expect(host.reportComponent()['hasHeader']()).toBe(false);
    });

    it('should be false when showHeader is true but no title or description', () => {
      host.showHeader.set(true);
      fixture.detectChanges();

      expect(host.reportComponent()['hasHeader']()).toBe(false);
    });

    it('should be true when showHeader is true and title is provided', () => {
      host.showHeader.set(true);
      host.title.set('Report Title');
      fixture.detectChanges();

      expect(host.reportComponent()['hasHeader']()).toBe(true);
    });
  });
});

@Component({
  selector: 'app-test-host',
  imports: [CcmsReportComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-report [loading]="loading()" [title]="title()" [showHeader]="showHeader()">
      <p>Report content</p>
    </ccms-report>
  `,
})
class TestHostComponent {
  loading = signal(false);
  title = signal<string | undefined>(undefined);
  showHeader = signal(false);

  reportComponent = viewChild.required(CcmsReportComponent);
}
