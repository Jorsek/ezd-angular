import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import {
  createBarChartOptions,
  createStackedBarChartOptions,
  BarChartData,
  StackedBarChartData,
} from '../bar-chart-options';

@Component({
  selector: 'ccms-bar-chart',
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
export class BarChartComponent {
  /** Data for a simple (non-stacked) bar chart */
  readonly data = input<BarChartData[]>();
  /** Data for a stacked bar chart - when provided, takes precedence over data */
  readonly stackedData = input<StackedBarChartData[]>();
  readonly title = input<string>();
  readonly description = input<string>();
  readonly unit = input<string>('items');
  readonly showLabels = input<boolean>(true);
  readonly showLegend = input<boolean>(false);
  readonly showGrid = input<boolean>(true);
  readonly horizontal = input<boolean>(false);
  readonly height = input<string | undefined>(undefined);
  readonly limitResults = input<number | undefined>(undefined);
  /** Whether to preserve the original order of items (useful for time-based data). Default: false (sorts by value). */
  readonly preserveOrder = input<boolean>(false);
  /** Optional color mapping by name/stack (e.g., { 'CURRENT': '#5CD69A' }) */
  readonly colorMap = input<Record<string, string>>();

  protected readonly chartOptions = computed<EChartsOption>(() => {
    const stacked = this.stackedData();
    const config = {
      unit: this.unit(),
      showLabels: this.showLabels(),
      showLegend: this.showLegend(),
      showGrid: this.showGrid(),
      horizontal: this.horizontal(),
      limitResults: this.limitResults(),
      preserveOrder: this.preserveOrder(),
      colorMap: this.colorMap(),
    };

    // Use stacked chart if stackedData is provided
    if (stacked && stacked.length > 0) {
      return createStackedBarChartOptions(stacked, config);
    }

    return createBarChartOptions(this.data(), config);
  });
}
