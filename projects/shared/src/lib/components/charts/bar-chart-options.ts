import type { EChartsOption } from 'echarts';
import { CHART_COLOR_PALETTE } from '../../constants/chart-colors';
import {
  aggregateChartData,
  aggregateStackedChartData,
  formatOtherTooltip,
  formatOtherStackedTooltip,
  OTHER_LABEL,
  type AggregatedChartData,
} from './chart-data-aggregation';

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

/** Data point for stacked bar charts */
export interface StackedBarChartData {
  /** The category on the x-axis (e.g., "Topic", "Concept") */
  category: string;
  /** The stack segment name (e.g., "Draft", "Published") */
  stack: string;
  /** The value for this category/stack combination */
  value: number;
}

export interface BarChartConfig {
  /** The unit label to display in tooltips (e.g., 'files', 'objects'). Default: 'items' */
  unit?: string;
  /** Whether to show the legend. Default: false */
  showLegend?: boolean;
  /** Whether to use horizontal bars. Default: false (vertical bars) */
  horizontal?: boolean;
  /** Whether to show value labels on bars. Default: true */
  showLabels?: boolean;
  /** Whether to show grid lines. Default: true */
  showGrid?: boolean;
  /** Maximum number of items to display. Remaining items are aggregated into "Other". */
  limitResults?: number;
  /** Whether to preserve the original order of items (useful for time-based data). Default: false (sorts by value). */
  preserveOrder?: boolean;
  /** Optional color mapping by name/stack (e.g., { 'CURRENT': '#5CD69A' }) */
  colorMap?: Record<string, string>;
}

/**
 * Creates ECharts options for a generic bar chart.
 * Automatically aggregates data into an "Other" category if limitResults is specified.
 *
 * @param data - Array of bar chart data items with name, value, and optional color
 * @param config - Configuration options for the chart
 * @returns ECharts options object for rendering the bar chart
 */
export function createBarChartOptions(
  data: BarChartData[] | null | undefined,
  config?: BarChartConfig,
): EChartsOption {
  const {
    unit = 'items',
    showLegend = false,
    horizontal = false,
    showLabels = true,
    showGrid = true,
    limitResults,
    preserveOrder = false,
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
  const { data: aggregatedData } = aggregateChartData(data, limitResults, preserveOrder);

  const categories = aggregatedData.map((item: AggregatedChartData) => item.name);
  const colors = aggregatedData.map(
    (item: AggregatedChartData, index: number) =>
      item.color ??
      colorMap?.[item.name] ??
      CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
  );

  // Build bar data with aggregatedItems for "Other" tooltip
  const barData = aggregatedData.map((item: AggregatedChartData, index: number) => ({
    value: item.value,
    name: item.name,
    aggregatedItems: item.aggregatedItems,
    itemStyle: {
      color: colors[index],
      borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
    },
  }));

  const categoryAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: {
      interval: 0,
      rotate: horizontal ? 0 : categories.length > 6 ? 45 : 0,
      fontSize: 12,
      color: '#6b7280',
    },
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisTick: {
      show: false,
    },
  };

  const valueAxis = {
    type: 'value' as const,
    axisLabel: {
      fontSize: 12,
      color: '#6b7280',
    },
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: showGrid,
      lineStyle: {
        color: '#f3f4f6',
        type: 'dashed' as const,
      },
    },
  };

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: unknown) => {
        const p = Array.isArray(params) ? params[0] : params;
        if (!p || typeof p !== 'object') return '';
        const param = p as Record<string, unknown>;
        const name = typeof param['name'] === 'string' ? param['name'] : '';
        const dataItem = param['data'] as {
          value: number;
          aggregatedItems?: { name: string; value: number }[];
        };
        const value = dataItem?.value ?? 0;

        // Special tooltip for "Other" category
        if (name === OTHER_LABEL && dataItem?.aggregatedItems) {
          return formatOtherTooltip(dataItem.aggregatedItems, unit, total);
        }

        const percentage = ((value / total) * 100).toFixed(1);
        return `${name}: <b>${value.toLocaleString('en-US')}</b> ${unit} (${percentage}%)`;
      },
      backgroundColor: 'rgba(0,0,0,0.85)',
      textStyle: { color: '#fff' },
    },
    legend: showLegend
      ? {
          orient: 'horizontal' as const,
          bottom: 10,
          left: 'center',
          textStyle: { fontSize: 14 },
        }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: showLegend ? '15%' : '3%',
      top: '8%',
      containLabel: true,
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: [
      {
        type: 'bar',
        data: barData,
        barMaxWidth: 50,
        label: showLabels
          ? {
              show: true,
              position: horizontal ? 'right' : 'top',
              formatter: '{c}',
              fontSize: 11,
              color: '#6b7280',
            }
          : { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        animationDuration: 800,
      },
    ],
  };
}

/**
 * Creates ECharts options for a stacked bar chart.
 * Automatically aggregates categories into an "Other" category if limitResults is specified.
 *
 * @param data - Array of stacked bar chart data items with category, stack, and value
 * @param config - Configuration options for the chart
 * @returns ECharts options object for rendering the stacked bar chart
 */
export function createStackedBarChartOptions(
  data: StackedBarChartData[] | null | undefined,
  config?: BarChartConfig,
): EChartsOption {
  const {
    unit = 'items',
    showLegend = true,
    horizontal = false,
    showLabels = false,
    showGrid = true,
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

  // Calculate total for percentage calculations (before aggregation)
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Aggregate data if limitResults is specified
  const { data: aggregatedData, otherCategoryDetails } = aggregateStackedChartData(
    data,
    limitResults,
  );

  // Extract unique categories and stack names from aggregated data
  const categories = [...new Set(aggregatedData.map((d) => d.category))];
  const stackNames = [...new Set(aggregatedData.map((d) => d.stack))];

  // Build a lookup map for quick value retrieval
  const valueMap = new Map<string, number>();
  for (const item of aggregatedData) {
    valueMap.set(`${item.category}|${item.stack}`, item.value);
  }

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

  // Build series - one per stack name
  const series = stackNames.map((stackName, index) => ({
    name: stackName,
    type: 'bar' as const,
    stack: 'total',
    data: categories.map((category) => valueMap.get(`${category}|${stackName}`) ?? 0),
    itemStyle: {
      color: colorMap?.[stackName] ?? CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
    },
    label: showLabels
      ? {
          show: true,
          position: 'inside' as const,
          formatter: (params: unknown) => {
            const p = params as Record<string, unknown>;
            const value = typeof p['value'] === 'number' ? p['value'] : 0;
            return value > 0 ? String(value) : '';
          },
          fontSize: 10,
          color: '#fff',
        }
      : { show: false },
    emphasis: {
      focus: 'series' as const,
    },
    animationDuration: 800,
  }));

  const categoryAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: {
      interval: 0,
      rotate: horizontal ? 0 : categories.length > 6 ? 45 : 0,
      fontSize: 12,
      color: '#6b7280',
    },
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
    axisTick: {
      show: false,
    },
  };

  const valueAxis = {
    type: 'value' as const,
    axisLabel: {
      fontSize: 12,
      color: '#6b7280',
    },
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: showGrid,
      lineStyle: {
        color: '#f3f4f6',
        type: 'dashed' as const,
      },
    },
  };

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: unknown) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const category = (params[0] as Record<string, unknown>)['axisValue'] as string;

        // Special tooltip for "Other" category
        if (category === OTHER_LABEL && otherCategoryDetails) {
          return formatOtherStackedTooltip(otherCategoryDetails, unit, total);
        }

        let html = `<b>${category}</b><br/>`;
        let categoryTotal = 0;
        for (const p of params) {
          const param = p as Record<string, unknown>;
          const value = param['value'] as number;
          if (value > 0) {
            categoryTotal += value;
            const color = (param['color'] as string) ?? '#333';
            const name = param['seriesName'] as string;
            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>`;
            html += `${name}: <b>${value.toLocaleString('en-US')}</b> ${unit}<br/>`;
          }
        }
        const percentage = ((categoryTotal / total) * 100).toFixed(1);
        html += `<br/>Total: <b>${categoryTotal.toLocaleString('en-US')}</b> ${unit} (${percentage}%)`;
        return html;
      },
      backgroundColor: 'rgba(0,0,0,0.85)',
      textStyle: { color: '#fff' },
    },
    legend: showLegend
      ? {
          orient: 'horizontal' as const,
          bottom: 10,
          left: 'center',
          textStyle: { fontSize: 12 },
          data: stackNames,
        }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: showLegend ? '15%' : '3%',
      top: '8%',
      containLabel: true,
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series,
  };
}
