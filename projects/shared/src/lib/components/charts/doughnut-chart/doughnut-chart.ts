import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { createDoughnutChartOptions, DoughnutChartData } from '../doughnut-chart-options';
import { CompactNumberPipe } from '@ccms/pipes/compact-number.pipe';

@Component({
  selector: 'ccms-doughnut-chart',
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
export class DoughnutChartComponent {
  private numberPipe = inject(CompactNumberPipe);
  readonly data = input<DoughnutChartData[]>();
  readonly title = input<string>();
  readonly description = input<string>();
  readonly unit = input<string>('items');
  readonly showLegend = input<boolean>(false);
  /** Text shown below the total in the center hole. Null hides the center text. */
  readonly centerLabel = input<string | null>(null);
  readonly height = input<string | undefined>(undefined);
  readonly limitResults = input<number | undefined>(undefined);

  protected readonly chartOptions = computed<EChartsOption>(() => {
    return createDoughnutChartOptions(this.data(), this.numberPipe, {
      unit: this.unit(),
      showLegend: this.showLegend(),
      centerLabel: this.centerLabel(),
      limitResults: this.limitResults(),
    });
  });
}
