import type { EChartsOption, DefaultLabelFormatterCallbackParams } from 'echarts';
import { CHART_COLOR_PALETTE } from '../../constants/chart-colors';
import {
  aggregateChartData,
  formatOtherTooltip,
  OTHER_LABEL,
  type AggregatedChartData,
} from './chart-data-aggregation';

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartConfig {
  /** The unit label to display in tooltips (e.g., 'files', 'objects'). Default: 'items' */
  unit?: string;
  /** Whether to show labels on pie slices. Default: true */
  showLabels?: boolean;
  /** Whether to show the legend. Default: true */
  showLegend?: boolean;
  /** The radius of the pie chart. Default: '60%' */
  radius?: string;
  /** Maximum number of slices to display. Remaining items are aggregated into "Other". */
  limitResults?: number;
  /** Optional color mapping by data name (e.g., { 'CURRENT': '#5CD69A' }) */
  colorMap?: Record<string, string>;
}

/**
 * Creates ECharts options for a generic pie chart.
 * Automatically aggregates data into an "Other" category if limitResults is specified.
 *
 * @param data - Array of pie chart data items with name, value, and optional color
 * @param config - Configuration options for the chart
 * @returns ECharts options object for rendering the pie chart
 */
export function createPieChartOptions(
  data: PieChartData[] | null | undefined,
  config?: PieChartConfig,
): EChartsOption {
  const {
    unit = 'items',
    showLabels = true,
    showLegend = true,
    radius = '50%',
    limitResults,
    colorMap,
  } = config ?? {};

  if (!data || data.length === 0) {
    return {
      title: {
        text: 'No data',
        left: 'center',
        top: 'center',
      },
      series: [],
    };
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

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

  // Aggregate data if limitResults is specified
  const { data: aggregatedData } = aggregateChartData(data, limitResults);

  const pieData = aggregatedData.map((item: AggregatedChartData, index: number) => ({
    name: item.name,
    value: item.value,
    itemStyle: {
      color:
        item.color ??
        colorMap?.[item.name] ??
        CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
    },
    // Store aggregated items for custom tooltip
    aggregatedItems: item.aggregatedItems,
  }));

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as Record<string, unknown>;
        const name = p['name'] as string;
        const value = p['value'] as number;
        const percent = p['percent'] as number;
        const dataItem = p['data'] as { aggregatedItems?: { name: string; value: number }[] };

        // Special tooltip for "Other" category
        if (name === OTHER_LABEL && dataItem.aggregatedItems) {
          return formatOtherTooltip(dataItem.aggregatedItems, unit, total);
        }

        return `${name}: <b>${value.toLocaleString('en-US')}</b> ${unit} (${percent.toFixed(1)}%)`;
      },
      backgroundColor: 'rgba(0,0,0,0.85)',
      textStyle: { color: '#fff' },
    },
    legend: showLegend
      ? {
          orient: 'horizontal',
          bottom: 10,
          left: 'center',
          textStyle: { fontSize: 14 },
        }
      : undefined,
    series: [
      {
        type: 'pie',
        radius,
        center: ['50%', '40%'],
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: showLabels
          ? {
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
            }
          : { show: false },
        labelLine: {
          show: showLabels,
          length: 10,
          length2: 20,
        },
        itemStyle: {
          borderRadius: 2,
        },
        animationDuration: 800,
      },
    ],
  };
}
