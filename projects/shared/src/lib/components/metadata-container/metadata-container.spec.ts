import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Component, ChangeDetectionStrategy } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MetadataContainerComponent } from './metadata-container';
import { GwtPresenterBridge } from '../../models/gwt-presenter-bridge.interface';

// Mock the ComputedMetadataComponent to avoid its dependencies
@Component({
  selector: 'ccms-computed-metadata',
  template: '<div class="mock-computed-metadata">Mock Extracted Metadata</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockComputedMetadataComponent {}

describe('MetadataContainerComponent', () => {
  let component: MetadataContainerComponent;
  let fixture: ComponentFixture<MetadataContainerComponent>;
  let mockBridge: GwtPresenterBridge;

  function createMockBridge(
    options: {
      isInitialized?: boolean;
      isFeatureEnabled?: boolean;
    } = {},
  ): GwtPresenterBridge {
    return {
      mount: vi.fn(),
      reveal: vi.fn(),
      hide: vi.fn(),
      unmount: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(options.isInitialized ?? true),
      isFeatureEnabled: vi.fn().mockReturnValue(options.isFeatureEnabled ?? false),
    };
  }

  function setupWindowBridge(bridge: GwtPresenterBridge | undefined): void {
    (
      window as unknown as { ccmsMetadataConfiguration?: GwtPresenterBridge }
    ).ccmsMetadataConfiguration = bridge;
  }

  beforeEach(async () => {
    mockBridge = createMockBridge();

    await TestBed.configureTestingModule({
      imports: [MetadataContainerComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(MetadataContainerComponent, {
        set: { imports: [MockComputedMetadataComponent] },
      })
      .compileComponents();
  });

  afterEach(() => {
    // Clean up window property
    setupWindowBridge(undefined);
  });

  describe('feature flag behavior', () => {
    it('should set extractedMetadataEnabled to true when INSIGHTS_CONTENT feature is enabled', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockBridge.isFeatureEnabled).toHaveBeenCalledWith('INSIGHTS_CONTENT');
      expect(component['extractedMetadataEnabled']()).toBe(true);
    });

    it('should set extractedMetadataEnabled to false when INSIGHTS_CONTENT feature is disabled', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: false });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockBridge.isFeatureEnabled).toHaveBeenCalledWith('INSIGHTS_CONTENT');
      expect(component['extractedMetadataEnabled']()).toBe(false);
    });

    it('should set extractedMetadataEnabled to false when bridge is not available', async () => {
      setupWindowBridge(undefined);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['extractedMetadataEnabled']()).toBe(false);
    });

    it('should set extractedMetadataEnabled to false when isFeatureEnabled method is not available', async () => {
      const bridgeWithoutFeatureCheck: GwtPresenterBridge = {
        mount: vi.fn(),
        reveal: vi.fn(),
        hide: vi.fn(),
        unmount: vi.fn(),
        isInitialized: vi.fn().mockReturnValue(true),
        // isFeatureEnabled is optional and not provided
      };
      setupWindowBridge(bridgeWithoutFeatureCheck);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['extractedMetadataEnabled']()).toBe(false);
    });

    it('should show Extracted Metadata tab button when feature is enabled', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      const tabButtons = fixture.nativeElement.querySelectorAll(
        '[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>;
      const tabLabels = Array.from(tabButtons).map((btn) => btn.textContent?.trim());

      expect(tabLabels).toContain('Extracted Metadata');
    });

    it('should hide Extracted Metadata tab button when feature is disabled', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: false });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      const tabButtons = fixture.nativeElement.querySelectorAll(
        '[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>;
      const tabLabels = Array.from(tabButtons).map((btn) => btn.textContent?.trim());

      expect(tabLabels).not.toContain('Extracted Metadata');
      expect(tabLabels).toContain('Metadata Configuration');
    });
  });

  describe('bridge initialization', () => {
    it('should set bridgeAvailable to true when bridge is initialized', async () => {
      mockBridge = createMockBridge({ isInitialized: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['bridgeAvailable']()).toBe(true);
    });

    it('should set bridgeAvailable to false when bridge is not initialized', async () => {
      mockBridge = createMockBridge({ isInitialized: false });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['bridgeAvailable']()).toBe(false);
    });

    it('should set bridgeAvailable to false when bridge is not on window', async () => {
      setupWindowBridge(undefined);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['bridgeAvailable']()).toBe(false);
    });

    it('should disable Metadata Configuration tab when bridge is not available', async () => {
      setupWindowBridge(undefined);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      const metadataConfigTab = fixture.nativeElement.querySelector(
        '[role="tab"]:first-child',
      ) as HTMLButtonElement;

      expect(metadataConfigTab.disabled).toBe(true);
    });
  });

  describe('tab switching', () => {
    it('should call bridge.hide when switching away from metadata-configuration tab', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      // Simulate that GWT presenter is mounted
      component['gwtMounted'].set(true);

      // Switch to computed-metadata tab
      component['onTabChange']('computed-metadata');
      fixture.detectChanges();

      expect(mockBridge.hide).toHaveBeenCalled();
    });

    it('should call bridge.reveal when switching back to metadata-configuration tab', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      // Simulate that GWT presenter is mounted
      component['gwtMounted'].set(true);

      // Switch to computed-metadata tab first
      component['onTabChange']('computed-metadata');
      vi.mocked(mockBridge.reveal).mockClear();

      // Switch back to metadata-configuration tab
      component['onTabChange']('metadata-configuration');
      fixture.detectChanges();

      expect(mockBridge.reveal).toHaveBeenCalled();
    });

    it('should not call bridge methods when switching to the same tab', async () => {
      mockBridge = createMockBridge({ isInitialized: true, isFeatureEnabled: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      component['gwtMounted'].set(true);
      vi.mocked(mockBridge.hide).mockClear();
      vi.mocked(mockBridge.reveal).mockClear();

      // Try switching to the already active tab
      component['onTabChange']('metadata-configuration');
      fixture.detectChanges();

      expect(mockBridge.hide).not.toHaveBeenCalled();
      expect(mockBridge.reveal).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should call bridge.unmount on destroy when presenter is mounted', async () => {
      mockBridge = createMockBridge({ isInitialized: true });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      // Simulate that GWT presenter is mounted
      component['gwtMounted'].set(true);

      // Destroy the component
      fixture.destroy();

      expect(mockBridge.unmount).toHaveBeenCalled();
    });

    it('should not call bridge.unmount on destroy when presenter is not mounted', async () => {
      // Use uninitialized bridge so afterNextRender won't auto-mount
      mockBridge = createMockBridge({ isInitialized: false });
      setupWindowBridge(mockBridge);

      fixture = TestBed.createComponent(MetadataContainerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      // GWT presenter is not mounted because bridge is not initialized
      expect(component['gwtMounted']()).toBe(false);

      // Destroy the component
      fixture.destroy();

      expect(mockBridge.unmount).not.toHaveBeenCalled();
    });
  });
});
