import type { EChartsOption } from 'echarts';
import { CHART_COLOR_PALETTE } from '../../constants/chart-colors';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';

/** Data point for multi-series line charts */
export interface LineChartData {
  /** The category on the x-axis (e.g., date/time label) */
  category: string;
  /** The series/line name */
  series: string;
  /** The value for this category/series combination */
  value: number;
}

export interface LineChartConfig {
  /** Whether to show the legend. Default: true */
  showLegend?: boolean;
  /** Whether to show grid lines. Default: true */
  showGrid?: boolean;
  /** Whether to stack the series. Default: false */
  stacked?: boolean;
  /** Whether to fill the area under lines. Default: false */
  areaFill?: boolean;
}

/**
 * Creates ECharts options for a multi-series line chart.
 *
 * @param data - Array of line chart data items with category, series, and value
 * @param numberPipe
 * @param config - Configuration options for the chart
 * @returns ECharts options object for rendering the line chart
 */
export function createLineChartOptions(
  data: LineChartData[] | null | undefined,
  numberPipe: CompactNumberPipe,
  config?: LineChartConfig,
): EChartsOption {
  const { showLegend = true, showGrid = true, stacked = false, areaFill = false } = config ?? {};

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

  // Extract unique categories and series names preserving insertion order
  const categories = [...new Set(data.map((d) => d.category))];
  const seriesNames = [...new Set(data.map((d) => d.series))];

  // Build a lookup map for quick value retrieval
  const valueMap = new Map<string, number>();
  for (const item of data) {
    valueMap.set(`${item.category}|${item.series}`, item.value);
  }

  const series = seriesNames.map((name, index) => ({
    name,
    type: 'line' as const,
    ...(stacked ? { stack: 'total' } : {}),
    ...(areaFill ? { areaStyle: {} } : {}),
    emphasis: {
      focus: 'series' as const,
    },
    data: categories.map((cat) => valueMap.get(`${cat}|${name}`) ?? 0),
    itemStyle: {
      color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
    },
    animationDuration: 800,
  }));

  const categoryAxis = {
    type: 'category' as const,
    boundaryGap: false,
    data: categories,
    axisLabel: {
      interval: 0,
      rotate: categories.length > 6 ? 45 : 0,
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
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
      formatter: (params: unknown) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const category = (params[0] as Record<string, unknown>)['axisValue'] as string;

        let html = `<b>${category}</b><br/>`;
        for (const p of params) {
          const param = p as Record<string, unknown>;
          const value = param['value'] as number;
          if (value > 0) {
            const color = (param['color'] as string) ?? '#333';
            const name = param['seriesName'] as string;
            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>`;
            html += `${name}: <b>${numberPipe.transform(value)}</b><br/>`;
          }
        }
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
          data: seriesNames,
        }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: showLegend ? '15%' : '3%',
      top: '8%',
      containLabel: true,
    },
    xAxis: categoryAxis,
    yAxis: valueAxis,
    series,
  };
}
