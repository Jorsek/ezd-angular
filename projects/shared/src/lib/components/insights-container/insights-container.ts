import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  signal,
} from '@angular/core';

type TabId = 'content-report' | 'localization-report';

/**
 * Container component that provides a tabbed interface for insights reports.
 * Combines the Content Report and Localization Report into a single tabbed view.
 *
 * Uses CUSTOM_ELEMENTS_SCHEMA instead of importing the child components directly
 * to avoid double instantiation when this component is used as a custom element.
 * The nested ccms-content-report and ccms-localization-insights elements are
 * handled by the browser's custom elements registry.
 */
@Component({
  selector: 'ccms-insights-container',
  templateUrl: './insights-container.html',
  styleUrl: './insights-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InsightsContainerComponent {
  contextUuid = input<string>();
  contextType = input<'map' | 'folder' | 'branch'>('folder');
  showLocalizationReport = input(false, { transform: booleanAttribute });

  protected activeTab = signal<TabId>('content-report');

  protected onTabChange(tab: TabId): void {
    if (this.activeTab() === tab) {
      return;
    }
    this.activeTab.set(tab);
  }
}
