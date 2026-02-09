import { adaptViewSortToTableSort, adaptViewCharts } from './insights-view-adapters';
import { InsightsViewChart, InsightsViewSort } from '../insights-views';

describe('adaptSort', () => {
  it('should return empty sort when no sorts provided', () => {
    const result = adaptViewSortToTableSort([]);

    expect(result).toEqual({ column: '', direction: 'asc' });
  });

  it('should convert ascending InsightsViewSort to Sort', () => {
    const sorts: InsightsViewSort[] = [{ field: 'title', ascending: true }];

    const result = adaptViewSortToTableSort(sorts);

    expect(result).toEqual({ column: 'title', direction: 'asc' });
  });

  it('should convert descending InsightsViewSort to Sort', () => {
    const sorts: InsightsViewSort[] = [{ field: 'createdUtc', ascending: false }];

    const result = adaptViewSortToTableSort(sorts);

    expect(result).toEqual({ column: 'createdUtc', direction: 'desc' });
  });

  it('should only use the first sort entry', () => {
    const sorts: InsightsViewSort[] = [
      { field: 'title', ascending: true },
      { field: 'date', ascending: false },
    ];

    const result = adaptViewSortToTableSort(sorts);

    expect(result.column).toBe('title');
  });
});

describe('adaptViewCharts', () => {
  it('should convert InsightsViewChart[] to Record<string, SummarySpec>', () => {
    const charts: InsightsViewChart[] = [
      { id: 'content_type', type: 'OBJECTS', field: 'contentType' },
      { id: 'owner_words', type: 'WORDS', field: 'owner' },
    ];

    const result = adaptViewCharts(charts);

    expect(result).toEqual({
      content_type: { type: 'OBJECTS', field: 'contentType' },
      owner_words: { type: 'WORDS', field: 'owner' },
    });
  });

  it('should return empty record for empty charts', () => {
    const result = adaptViewCharts([]);

    expect(result).toEqual({});
  });
});
