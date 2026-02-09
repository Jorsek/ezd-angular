import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { ContentInsightsSummaries } from '@ccms/services/content-report.service';
import { CalloutSectionComponent } from '@ccms/components/reporting/callout-section/callout-section';
import { CalloutConfig } from '@ccms/components/reporting/callout-section/callout-config.interface';

interface BreakdownItem {
  name: string;
  count: number;
}

@Component({
  selector: 'ccms-folder-insights-display',
  templateUrl: './folder-insights-display.component.html',
  styleUrl: './folder-insights-display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CalloutSectionComponent],
})
export class FolderInsightsDisplayComponent {
  data = input.required<ContentInsightsSummaries>();

  protected callouts = computed(() => this.data().callouts);

  private folders = computed<BreakdownItem[]>(() => [
    {
      name: 'Folders',
      count: this.data()?.callouts['TOTAL_FOLDERS'] ?? 0,
    },
  ]);

  protected calloutItems = computed<CalloutConfig[]>(() => [
    { id: 'TOTAL_OBJECTS', label: 'Total Files', compact: true, compactThreshold: 1_000 },
    { id: 'TOTAL_WORDS', label: 'Total Words', compact: true, compactThreshold: 1_000 },
  ]);

  protected contentTypeBreakdown = computed(() => {
    const items = this.folders().concat(
      (this.data().summaries['content_type'] ?? []).map(
        (item) => ({ name: item.name, count: item.value }) satisfies BreakdownItem,
      ),
    );

    items.sort((a, b) => b.count - a.count);
    return items;
  });
}
