import type { EChartsOption } from 'echarts';
import { CHART_COLOR_PALETTE } from '../../constants/chart-colors';
import {
  aggregateChartData,
  formatOtherTooltip,
  OTHER_LABEL,
  type AggregatedChartData,
} from './chart-data-aggregation';
import { enumToFriendly } from '@ccms/utils/text.util';
import { CompactNumberPipe } from '@ccms/pipes/compact-number.pipe';

export interface DoughnutChartData {
  name: string;
  value: number;
  color?: string;
}

export interface DoughnutChartConfig {
  /** The unit label to display in tooltips (e.g., 'issues', 'files'). Default: 'items' */
  unit?: string;
  /** Whether to show the legend. Default: false */
  showLegend?: boolean;
  /** Text shown below the total in the center hole. Null hides the center text. Default: null */
  centerLabel?: string | null;
  /** Inner radius of the doughnut hole. Default: '40%' */
  innerRadius?: string;
  /** Outer radius of the doughnut. Default: '70%' */
  outerRadius?: string;
  /** Maximum number of slices to display. Remaining items are aggregated into "Other". */
  limitResults?: number;
}

/**
 * Creates ECharts options for a doughnut (ring) chart.
 * Automatically aggregates data into an "Other" category if limitResults is specified.
 *
 * @param data - Array of doughnut chart data items with name, value, and optional color
 * @param config - Configuration options for the chart
 * @returns ECharts options object for rendering the doughnut chart
 */
export function createDoughnutChartOptions(
  data: DoughnutChartData[] | null | undefined,
  numberPipe: CompactNumberPipe,
  config?: DoughnutChartConfig,
): EChartsOption {
  const {
    unit = 'items',
    showLegend = false,
    centerLabel = null,
    innerRadius = '40%',
    outerRadius = '70%',
    limitResults,
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

  const doughnutData = aggregatedData.map((item: AggregatedChartData, index: number) => ({
    name: item.name,
    value: item.value,
    aggregatedItems: item.aggregatedItems,
    itemStyle: {
      color: item.color ?? CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      borderRadius: 10,
      borderColor: '#fff',
      borderWidth: 2,
    },
  }));

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as Record<string, unknown>;
        const name = p['name'] as string;
        const value = p['value'] as number;
        const dataItem = p['data'] as { aggregatedItems?: { name: string; value: number }[] };

        // Special tooltip for "Other" category
        if (name === OTHER_LABEL && dataItem?.aggregatedItems) {
          return formatOtherTooltip(dataItem.aggregatedItems, unit, total);
        }

        return `${enumToFriendly(name)}: <b>${numberPipe.transform(value)}</b>`;
      },
      backgroundColor: 'rgba(0,0,0,0.85)',
      textStyle: { color: '#fff' },
    },
    graphic:
      centerLabel != null
        ? [
            {
              type: 'text' as const,
              left: 'center',
              top: '46%',
              style: {
                text: numberPipe.transform(total),
                align: 'center',
                fill: '#333',
                fontSize: 24,
                fontWeight: 'bold' as const,
              },
            },
            {
              type: 'text' as const,
              left: 'center',
              top: '54%',
              style: {
                text: centerLabel,
                align: 'center',
                fill: '#6b7280',
                fontSize: 14,
              },
            },
          ]
        : [],
    legend: showLegend
      ? {
          orient: 'horizontal' as const,
          bottom: 10,
          left: 'center',
          textStyle: { fontSize: 12 },
        }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: [innerRadius, outerRadius],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: doughnutData,
        animationDuration: 800,
      },
    ],
  };
}
