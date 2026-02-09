import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { LocaleSummaryResponse } from '../../models/locale-summary-response.interface';
import { CHART_COLORS } from '../../constants/localization-chart-colors';

@Component({
  selector: 'ccms-localization-stacked-bar',
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
        min-height: 400px;
      }
      .chart-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class LocalizationStackedBarComponent {
  readonly data = input<LocaleSummaryResponse | null>(null);
  readonly height = input<string | undefined>(undefined);

  protected readonly chartOptions = computed<EChartsOption>(() => {
    const data = this.data();

    if (!data?.summary || Object.keys(data.summary).length === 0) {
      return {
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
        },
        series: [],
      };
    }

    // Create a map of locale codes to display names for easy lookup
    const localeMap = new Map<string, string>();
    data.locales.forEach((locale) => {
      localeMap.set(locale.code, locale.displayName);
    });

    const sorted = Object.keys(data.summary).sort((a, b) =>
      (localeMap.get(a) || a).localeCompare(localeMap.get(b) || b),
    );

    const current: number[] = [];
    const missing: number[] = [];
    const outdated: number[] = [];
    const categories: string[] = [];

    sorted.forEach((code) => {
      const s = data.summary[code].summary || {};
      current.push(s.CURRENT || 0);
      missing.push(s.MISSING || 0);
      outdated.push(s.OUTDATED || 0);
      categories.push(`${localeMap.get(code) || code} (${code})`);
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Current', 'Missing', 'Outdated'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'Keys',
      },
      yAxis: {
        type: 'category',
        data: categories,
      },
      series: [
        {
          name: 'Current',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: current,
          itemStyle: { color: CHART_COLORS.CURRENT },
        },
        {
          name: 'Missing',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: missing,
          itemStyle: { color: CHART_COLORS.MISSING },
        },
        {
          name: 'Outdated',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: outdated,
          itemStyle: { color: CHART_COLORS.OUTDATED },
        },
      ],
    };
  });
}
