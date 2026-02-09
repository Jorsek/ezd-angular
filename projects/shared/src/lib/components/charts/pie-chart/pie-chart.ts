import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { createPieChartOptions, PieChartData } from '../pie-chart-options';

@Component({
  selector: 'ccms-pie-chart',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.height]': 'height()',
  },
  template: `
    @if (title()) {
      <div class="chart-header">
        <div class="chart-title">{{ title() }}</div>
        @if (description()) {
          <div class="chart-description">{{ description() }}</div>
        }
      </div>
    }
    <div echarts [options]="chartOptions()" class="chart-container"></div>
  `,
  styleUrl: '../chart-common.css',
})
export class PieChartComponent {
  readonly data = input<PieChartData[]>();
  readonly title = input<string>();
  readonly description = input<string>();
  readonly unit = input<string>('items');
  readonly showLabels = input<boolean>(true);
  readonly showLegend = input<boolean>(true);
  readonly height = input<string | undefined>(undefined);
  readonly limitResults = input<number | undefined>(undefined);
  /** Optional color mapping by data name (e.g., { 'CURRENT': '#5CD69A' }) */
  readonly colorMap = input<Record<string, string>>();

  protected readonly chartOptions = computed<EChartsOption>(() => {
    return createPieChartOptions(this.data(), {
      unit: this.unit(),
      showLabels: this.showLabels(),
      showLegend: this.showLegend(),
      limitResults: this.limitResults(),
      colorMap: this.colorMap(),
    });
  });
}
