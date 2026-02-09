import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ComputedMetadataComponent } from '../../computed-metadata/components/computed-metadata/computed-metadata.component';
import {
  GwtPresenterBridge,
  WindowWithGwtBridge,
} from '../../models/gwt-presenter-bridge.interface';

type TabId = 'computed-metadata' | 'metadata-configuration';

/**
 * Container component that provides a tabbed interface for metadata management.
 * Combines the Angular ComputedMetadataComponent with the GWT MetadataConfigurationPresenter.
 *
 * This component demonstrates an "outside-in" Angular/GWT integration pattern where
 * Angular acts as the container for GWT content.
 */
@Component({
  selector: 'ccms-metadata-container',
  templateUrl: './metadata-container.html',
  styleUrl: './metadata-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComputedMetadataComponent],
})
export class MetadataContainerComponent implements OnInit, OnDestroy {
  /**
   * Reference to the GWT container div where the MetadataConfigurationPresenter will be mounted.
   */
  gwtContainerRef = viewChild<ElementRef<HTMLDivElement>>('gwtContainer');

  protected activeTab = signal<TabId>('metadata-configuration');
  protected gwtMounted = signal(false);
  protected bridgeAvailable = signal(false);
  protected extractedMetadataEnabled = signal(false);

  private bridge: GwtPresenterBridge | null = null;

  constructor() {
    afterNextRender(() => {
      if (this.bridgeAvailable() && this.activeTab() === 'metadata-configuration') {
        this.mountGwtPresenter();
      }
    });
  }

  ngOnInit(): void {
    this.bridge =
      (window as unknown as WindowWithGwtBridge<'ccmsMetadataConfiguration'>)
        .ccmsMetadataConfiguration ?? null;
    this.bridgeAvailable.set(this.bridge?.isInitialized?.() ?? false);
    this.extractedMetadataEnabled.set(this.bridge?.isFeatureEnabled?.('INSIGHTS_CONTENT') ?? false);
  }

  ngOnDestroy(): void {
    this.unmountGwtPresenter();
  }

  /**
   * Handle tab selection change.
   * Manages the GWT presenter lifecycle based on which tab is active.
   */
  protected onTabChange(tab: TabId): void {
    const previousTab = this.activeTab();

    if (previousTab === tab) {
      return;
    }

    // Hide GWT presenter when switching away from its tab
    if (previousTab === 'metadata-configuration' && this.gwtMounted()) {
      this.bridge?.hide();
    }

    this.activeTab.set(tab);

    // Mount or reveal GWT presenter when switching to metadata configuration tab
    if (tab === 'metadata-configuration') {
      if (!this.gwtMounted()) {
        this.mountGwtPresenter();
      } else {
        this.bridge?.reveal();
      }
    }
  }

  private mountGwtPresenter(): void {
    const containerRef = this.gwtContainerRef();
    if (!this.bridge || !containerRef?.nativeElement) {
      return;
    }

    this.bridge.mount(containerRef.nativeElement);
    this.bridge.reveal();
    this.gwtMounted.set(true);
  }

  /**
   * Unmount and cleanup the GWT presenter.
   * Called when the Angular component is destroyed.
   */
  private unmountGwtPresenter(): void {
    if (this.bridge && this.gwtMounted()) {
      this.bridge.unmount();
      this.gwtMounted.set(false);
    }
  }
}
