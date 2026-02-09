import type { EChartsOption, DefaultLabelFormatterCallbackParams } from 'echarts';
import { CHART_COLORS } from '../../constants/localization-chart-colors';

export interface LocalizationStatusData {
  CURRENT?: number;
  MISSING?: number;
  OUTDATED?: number;
}

/**
 * Creates ECharts options for a localization status pie chart.
 *
 * @param data - The localization status data (CURRENT, MISSING, OUTDATED counts)
 * @param unit - The unit label to display in tooltips (e.g., 'files', 'words')
 * @returns ECharts options object for rendering the pie chart
 */
export function createLocalizationPieChartOptions(
  data: LocalizationStatusData | null | undefined,
  unit: string,
): EChartsOption {
  if (!data) {
    return {
      title: {
        text: 'No data',
        left: 'center',
        top: 'center',
      },
      series: [],
    };
  }

  const { CURRENT = 0, MISSING = 0, OUTDATED = 0 } = data;
  const total = CURRENT + MISSING + OUTDATED;

  if (total === 0) {
    return {
      title: {
        text: 'No data',
        left: 'center',
        top: 'center',
      },
      series: [],
    };
  }

  const pieData = [
    { name: 'Current', value: CURRENT, itemStyle: { color: CHART_COLORS.CURRENT } },
    { name: 'Missing', value: MISSING, itemStyle: { color: CHART_COLORS.MISSING } },
    { name: 'Outdated', value: OUTDATED, itemStyle: { color: CHART_COLORS.OUTDATED } },
  ].filter((item) => item.value > 0);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: `{b}: <b>{c}</b> ${unit} ({d}%)`,
      backgroundColor: 'rgba(0,0,0,0.85)',
      textStyle: { color: '#fff' },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['50%', '45%'],
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: {
          show: true,
          formatter: (params: DefaultLabelFormatterCallbackParams) => {
            const value = typeof params.value === 'number' ? params.value : 0;
            const count = value.toLocaleString('en-US');
            const percent = params.percent?.toFixed(1) ?? '0.0';
            return `${count}\n(${percent}%)`;
          },
          fontSize: 13,
          fontWeight: 'normal',
          overflow: 'none',
          align: 'center',
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 20,
        },
        itemStyle: {
          borderRadius: 6,
        },
        animationDuration: 800,
      },
    ],
  };
}
