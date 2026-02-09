import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import {
  createLocalizationPieChartOptions,
  type LocalizationStatusData,
} from '../charts/localization-pie-chart-options';

export type WordCountData = LocalizationStatusData;

@Component({
  selector: 'ccms-word-count-pie-chart',
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
export class WordCountPieChartComponent {
  readonly data = input<WordCountData>();
  readonly height = input<string | undefined>(undefined);

  protected readonly chartOptions = computed<EChartsOption>(() => {
    return createLocalizationPieChartOptions(this.data(), 'words');
  });
}
