import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { StatCardComponent } from '../../stat-card/stat-card';
import { SkeletonComponent } from '../skeleton/skeleton';
import { ReportSectionComponent } from '../report-section/report-section';
import { CalloutConfig } from './callout-config.interface';

@Component({
  selector: 'ccms-callout-section',
  templateUrl: './callout-section.html',
  styleUrl: './callout-section.css',
  imports: [StatCardComponent, SkeletonComponent, ReportSectionComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalloutSectionComponent {
  // Header inputs (passed to report-section)
  title = input<string>();
  summaryText = input<string>();
  icon = input<string>();

  // Data inputs
  loading = input<boolean>(false);
  callouts = input<Record<string, number>>({});
  highlighted = input<CalloutConfig | null>(null);
  items = input<CalloutConfig[]>([]);
  compact = input<boolean>(false);

  // Only show highlighted if it has a value in the response
  protected hasHighlightedValue = computed(() => {
    const h = this.highlighted();
    return h !== null && this.callouts()[h.id] !== undefined;
  });

  // Filter items to only those with values in the response
  protected visibleItems = computed(() => {
    const callouts = this.callouts();
    return this.items().filter((item) => callouts[item.id] !== undefined);
  });

  // Show "no data" if neither highlighted nor any items have values
  protected hasData = computed(() => this.hasHighlightedValue() || this.visibleItems().length > 0);

  protected getValue(id: string): number | null {
    return this.callouts()[id] ?? null;
  }
}
