import { InsightsViewChart, InsightsViewSort } from '../insights-views';
import { SummarySpec, SummaryType } from '../../services/content-report.service';
import { Sort } from '../table/rich-table';

export function adaptViewSortToTableSort(sorts: InsightsViewSort[]): Sort {
  if (sorts.length === 0) {
    return {
      column: '',
      direction: 'asc',
    };
  }
  const sort = sorts[0];
  return {
    column: sort.field,
    direction: sort.ascending ? 'asc' : 'desc',
  };
}

export function adaptViewCharts(charts: InsightsViewChart[]): Record<string, SummarySpec> {
  const result: Record<string, SummarySpec> = {};

  for (const chart of charts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = chart.options as any;
    const spec: SummarySpec = {
      type: chart.type as SummaryType,
      field: chart.field,
    };
    // Include stackBy if present in options
    if (options?.stackBy) {
      spec.stackBy = options.stackBy;
    }
    // Include bucket if timeBucket is present in options
    if (options?.timeBucket) {
      spec.bucket = options.timeBucket;
    }
    result[chart.id] = spec;
  }

  return result;
}
