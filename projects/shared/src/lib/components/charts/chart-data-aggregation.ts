import type { PieChartData } from './pie-chart-options';
import type { BarChartData, StackedBarChartData } from './bar-chart-options';

/** Default maximum number of items to display before aggregating into "Other" */
export const DEFAULT_MAX_CHART_ITEMS = 20;

/** Label used for the aggregated "Other" category */
export const OTHER_LABEL = 'Other';

/** Extended data type that can carry aggregated items for tooltip display */
export interface AggregatedChartData extends BarChartData {
  /** Original items that were aggregated into this entry (for "Other" tooltip) */
  aggregatedItems?: { name: string; value: number }[];
}

/** Result of aggregating simple chart data */
export interface AggregatedDataResult {
  data: AggregatedChartData[];
  hasOther: boolean;
}

/** Result of aggregating stacked chart data */
export interface AggregatedStackedDataResult {
  data: StackedBarChartData[];
  hasOther: boolean;
  /** Original category data that was aggregated into "Other" */
  otherCategoryDetails?: { category: string; total: number }[];
}

/**
 * Aggregates chart data to limit the number of displayed items.
 * If there are more than maxItems items, the top (maxItems - 1)
 * items are shown individually, and the rest are combined into an "Other" category.
 *
 * @param data - Array of chart data items (works for both PieChartData and BarChartData)
 * @param maxItems - Maximum number of items to display (including "Other"). If undefined, no limit is applied.
 * @param preserveOrder - If true, preserves the original order of items (useful for time-based data). Default: false (sorts by value descending).
 * @returns Aggregated data with "Other" category if needed
 */
export function aggregateChartData(
  data: (PieChartData | BarChartData)[] | null | undefined,
  maxItems?: number,
  preserveOrder = false,
): AggregatedDataResult {
  if (!data || data.length === 0) {
    return { data: [], hasOther: false };
  }

  // Filter out zero values, optionally sort by value descending
  let processedData = [...data].filter((item) => item.value > 0);
  if (!preserveOrder) {
    processedData = processedData.sort((a, b) => b.value - a.value);
  }

  // If no limit specified or within limit, return as-is
  if (maxItems === undefined || processedData.length <= maxItems) {
    return {
      data: processedData.map((item) => ({
        name: item.name,
        value: item.value,
        color: item.color,
      })),
      hasOther: false,
    };
  }

  // Take top (maxItems - 1) items
  const topItems = processedData.slice(0, maxItems - 1);
  const remainingItems = processedData.slice(maxItems - 1);

  // Calculate "Other" total
  const otherTotal = remainingItems.reduce((sum, item) => sum + item.value, 0);

  // Build result with "Other" as the last item
  const result: AggregatedChartData[] = topItems.map((item) => ({
    name: item.name,
    value: item.value,
    color: item.color,
  }));

  result.push({
    name: OTHER_LABEL,
    value: otherTotal,
    aggregatedItems: remainingItems.map((item) => ({
      name: item.name,
      value: item.value,
    })),
  });

  return { data: result, hasOther: true };
}

/**
 * Aggregates stacked bar chart data to limit the number of categories.
 * Categories are ranked by their total value (sum of all stack segments).
 * If there are more than maxItems categories, the top (maxItems - 1)
 * are shown individually, and the rest are combined into an "Other" category.
 *
 * @param data - Array of stacked bar chart data items
 * @param maxItems - Maximum number of categories to display (including "Other"). If undefined, no limit is applied.
 * @returns Aggregated data with "Other" category if needed
 */
export function aggregateStackedChartData(
  data: StackedBarChartData[] | null | undefined,
  maxItems?: number,
): AggregatedStackedDataResult {
  if (!data || data.length === 0) {
    return { data: [], hasOther: false };
  }

  // Calculate total per category
  const categoryTotals = new Map<string, number>();
  for (const item of data) {
    const current = categoryTotals.get(item.category) ?? 0;
    categoryTotals.set(item.category, current + item.value);
  }

  // Sort categories by total value descending
  const sortedCategories = [...categoryTotals.entries()]
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  // If no limit specified or within limit, return as-is
  if (maxItems === undefined || sortedCategories.length <= maxItems) {
    return { data: [...data], hasOther: false };
  }

  // Determine which categories to keep vs aggregate
  const keepCategories = new Set(sortedCategories.slice(0, maxItems - 1));
  const otherCategories = sortedCategories.slice(maxItems - 1);

  // Build result: keep individual category data for top categories
  const result: StackedBarChartData[] = data.filter((item) => keepCategories.has(item.category));

  // Aggregate remaining categories into "Other" by stack
  const otherByStack = new Map<string, number>();
  for (const item of data) {
    if (!keepCategories.has(item.category)) {
      const current = otherByStack.get(item.stack) ?? 0;
      otherByStack.set(item.stack, current + item.value);
    }
  }

  // Add "Other" entries for each stack
  for (const [stack, value] of otherByStack.entries()) {
    if (value > 0) {
      result.push({
        category: OTHER_LABEL,
        stack,
        value,
      });
    }
  }

  // Collect details about aggregated categories for tooltip
  const otherCategoryDetails = otherCategories.map((category) => ({
    category,
    total: categoryTotals.get(category) ?? 0,
  }));

  return {
    data: result,
    hasOther: true,
    otherCategoryDetails,
  };
}

/**
 * Formats the "Other" tooltip content showing all aggregated items.
 *
 * @param items - Array of aggregated items with name and value
 * @param unit - Unit label (e.g., 'items', 'files')
 * @param total - Total value for percentage calculation
 * @returns HTML string for tooltip
 */
export function formatOtherTooltip(
  items: { name: string; value: number }[],
  unit: string,
  total: number,
): string {
  const otherTotal = items.reduce((sum, item) => sum + item.value, 0);
  const percentage = total > 0 ? ((otherTotal / total) * 100).toFixed(1) : '0.0';

  let html = `<b>${OTHER_LABEL}</b>: ${otherTotal.toLocaleString('en-US')} ${unit} (${percentage}%)<br/>`;
  html += `<br/><span style="font-size:11px;color:#ccc;">Includes ${items.length} items:</span><br/>`;

  // Show up to 10 items in tooltip, then summarize
  const displayItems = items.slice(0, 10);
  for (const item of displayItems) {
    const itemPercent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
    html += `<span style="font-size:11px;">&bull; ${item.name}: ${item.value.toLocaleString('en-US')} (${itemPercent}%)</span><br/>`;
  }

  if (items.length > 10) {
    const remaining = items.length - 10;
    html += `<span style="font-size:11px;color:#ccc;">... and ${remaining} more</span>`;
  }

  return html;
}

/**
 * Formats the "Other" category tooltip for stacked bar charts.
 *
 * @param categoryDetails - Array of categories aggregated into "Other"
 * @param unit - Unit label
 * @param total - Total value for percentage calculation
 * @returns HTML string for tooltip
 */
export function formatOtherStackedTooltip(
  categoryDetails: { category: string; total: number }[],
  unit: string,
  total: number,
): string {
  const otherTotal = categoryDetails.reduce((sum, item) => sum + item.total, 0);
  const percentage = total > 0 ? ((otherTotal / total) * 100).toFixed(1) : '0.0';

  let html = `<b>${OTHER_LABEL}</b><br/>`;
  html += `Total: ${otherTotal.toLocaleString('en-US')} ${unit} (${percentage}%)<br/>`;
  html += `<br/><span style="font-size:11px;color:#ccc;">Includes ${categoryDetails.length} categories:</span><br/>`;

  // Show up to 10 categories in tooltip, then summarize
  const displayItems = categoryDetails.slice(0, 10);
  for (const item of displayItems) {
    html += `<span style="font-size:11px;">&bull; ${item.category}: ${item.total.toLocaleString('en-US')}</span><br/>`;
  }

  if (categoryDetails.length > 10) {
    const remaining = categoryDetails.length - 10;
    html += `<span style="font-size:11px;color:#ccc;">... and ${remaining} more</span>`;
  }

  return html;
}
