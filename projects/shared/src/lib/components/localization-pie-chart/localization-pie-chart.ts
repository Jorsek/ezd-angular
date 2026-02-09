import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Resources } from '../../models/locale-summary-response.interface';
import { createLocalizationPieChartOptions } from '../charts/localization-pie-chart-options';

@Component({
  selector: 'ccms-localization-pie-chart',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.height]': 'height()',
  },
  template: ` <div echarts [options]="chartOptions()" class="chart-container"></div> `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        min-height: 200px;
      }
      .chart-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class LocalizationPieChartComponent {
  readonly resources = input<Resources>();
  readonly height = input<string | undefined>(undefined);

  protected readonly chartOptions = computed<EChartsOption>(() => {
    const resources = this.resources();
    return createLocalizationPieChartOptions(
      resources?.total === 0 ? null : resources?.summary,
      'files',
    );
  });
}
