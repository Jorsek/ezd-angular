import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { createLineChartOptions, LineChartData } from '../line-chart-options';
import { CompactNumberPipe } from '../../../pipes/compact-number.pipe';

@Component({
  selector: 'ccms-line-chart',
  imports: [NgxEchartsDirective],
  providers: [CompactNumberPipe],
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
export class LineChartComponent {
  private numberPipe = inject(CompactNumberPipe);
  readonly data = input<LineChartData[]>();
  readonly title = input<string>();
  readonly description = input<string>();
  readonly showLegend = input<boolean>(true);
  readonly showGrid = input<boolean>(true);
  readonly stacked = input<boolean>(false);
  readonly areaFill = input<boolean>(false);
  readonly height = input<string | undefined>(undefined);

  protected readonly chartOptions = computed<EChartsOption>(() => {
    return createLineChartOptions(this.data(), this.numberPipe, {
      showLegend: this.showLegend(),
      showGrid: this.showGrid(),
      stacked: this.stacked(),
      areaFill: this.areaFill(),
    });
  });
}
