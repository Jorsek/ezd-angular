import {
  AddChartEvent,
  Chart,
  ChartUpdateEvent,
  CustomChartListComponent,
} from './custom-chart-list/custom-chart-list';
import { ChartConfig } from './configure-chart/configure-chart';
import { ColumnDef, RichTableComponent, Sort } from '../table/rich-table';
import {
  STATIC_FILTER_FIELDS,
  CALLOUT_CONFIG,
  SYSTEM_FIELDS_COL_DEFS,
  DEFAULT_CONTENT_VIEW,
} from './content-report-constants';
import { map, shareReplay } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createPaginatedResource } from '../../utils/paginated-resource';
import {
  CalloutTypes,
  ContentInsightDetail,
  ContentInsightsSummaries,
  ContentReportService,
} from '../../services/content-report.service';
import { createInitialLoadTracker } from '@ccms/utils/initial-load-tracker';
import { ColumnConfigFactoryService } from '../../services/column-config-factory.service';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { FilterSectionComponent } from '../localization-insights/filter-section/filter-section';
import { CalloutSectionComponent } from '../reporting/callout-section/callout-section';
import { CalloutConfig } from '../reporting/callout-section/callout-config.interface';
import { MetadataConfigurationService } from '../../services/metadata/metadata-configuration.service';
import { Field } from '../../models/filter-field.interface';
import { FilterCategory } from '../../models/filter.interface';
import { injectFilterBuilder } from '../../utils/filter-builder';
import { Context, ContextType, contextEquals } from '../../models/server-context.interface';
import { CurrentViewService, ViewFilter, InsightsView, InsightsViewChart } from '../insights-views';
import { ContentInsightsControllerService } from '@ccms/api/api/content-insights-controller.service';
import { Context as ApiContext } from '@ccms/api/model/models';
import { CcmsReportComponent } from '../ccms-report';
import { NotificationService, NotificationOutletComponent } from '../ccms-notifications';
import { adaptViewCharts, adaptViewSortToTableSort } from './insights-view-adapters';
import { TextCellComponent } from '../reporting/cell-renderers';

@Component({
  selector: 'ccms-content-report',
  templateUrl: './content-report.html',
  imports: [
    FilterSectionComponent,
    CustomChartListComponent,
    CalloutSectionComponent,
    RichTableComponent,
    CcmsReportComponent,
    NotificationOutletComponent,
  ],
  providers: [ContentReportService, CurrentViewService, NotificationService],
  styleUrl: './content-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ContentReportComponent {
  contextUuid = input<string>();
  contextType = input<ContextType>('folder');

  /** Computed context from inputs, null if no contextUuid provided */
  protected context = computed<Context | null>(() => {
    const id = this.contextUuid();
    if (!id) return null;
    const type = this.contextType();
    console.assert(!!type, 'contextType must be defined when contextUuid is provided');
    return {
      type: type.toUpperCase() as 'MAP' | 'FOLDER' | 'BRANCH',
      id,
    };
  });

  private readonly destroyRef = inject(DestroyRef);
  private service = inject(ContentReportService);
  private api = inject(ContentInsightsControllerService);
  private columnConfigFactory = inject(ColumnConfigFactoryService);
  private metadataService = inject(MetadataConfigurationService);
  protected currentViewService = inject(CurrentViewService);
  private notificationService = inject(NotificationService);
  private createFilterBuilder = injectFilterBuilder();

  /** Default views for the content report */
  protected defaultViews: InsightsView[] = [DEFAULT_CONTENT_VIEW];

  /** Fields that are searchable (text type fields in visible columns) */
  protected searchFields = computed(() => {
    const columns = this.currentViewService.viewReady() ? this.currentViewService.columns() : [];
    const visibleFields = new Set(columns.map((col) => col.field));
    return this.allFields()
      .filter((f) => f.type === 'text' && visibleFields.has(f.name))
      .map((f) => f.name);
  });

  /** All available fields: static report fields + dynamic metadata/computed fields, sorted by displayName */
  protected allFields = signal<Field[]>(
    [...STATIC_FILTER_FIELDS].sort((a, b) => a.displayName.localeCompare(b.displayName)),
  );

  /** Available filters derived from allFields using FilterBuilder */
  protected filters = computed<FilterCategory[]>(() => {
    const fields = this.allFields();
    const ctx = this.context();
    const builder = this.createFilterBuilder();

    // Add search filter
    builder.add({
      id: 'search',
      label: 'Search',
      type: 'search',
      default: true,
      removable: false,
    });

    // Add field-based filters
    for (const field of fields) {
      if (field.type === 'boolean') continue;

      if (field.name === 'fileStatus') {
        // Special handling for fileStatus - use centralized file status filter
        builder.addFileStatusFilter(false, true);
      } else if (field.type === 'taxonomy') {
        // Taxonomy - FilterBuilder handles options via getTaxonomyFields()
        builder.addField(field);
      } else if (field.type === 'number' || field.type === 'datetime') {
        // Number and datetime use default FilterBuilder behavior
        builder.addField(field);
      } else {
        // Text/label fields - list with distinct values via generated API
        const filter = ctx ? { context: ctx as ApiContext } : undefined;
        const options$ = this.api.getDistinctValues1(field.name, filter).pipe(
          map((values) => values.map((v) => ({ value: v, label: v }))),
          shareReplay(1),
        );
        builder.addField(field, {
          type: 'list',
          options: () => options$,
          selectionMode: field.multiSelect ? 'multi' : 'single',
          searchable: true,
        });
      }
    }

    return builder.build();
  });

  protected columns = signal<ColumnDef<ContentInsightDetail>[]>([]);

  protected sort = computed(() => adaptViewSortToTableSort(this.currentViewService.sorts()));

  // ──────────────────────────────── DETAILS DATA (paginated resource) ────────────────────────────────

  /** Paginated resource for table data */
  private pagination = createPaginatedResource<
    ContentInsightDetail,
    { filters: ViewFilter[]; sort: Sort }
  >({
    params: () => {
      if (!this.currentViewService.viewReady() || !this.contextReady()) return null;
      return {
        filters: this.currentViewService.filters(),
        sort: this.sort(),
      };
    },
    fetch: (params, page) =>
      this.service.fetchContentInsightsDetails(page, params.filters, params.sort).pipe(
        map((r) => ({
          rows: r.data,
          total: r.total,
          // Service doesn't return hasMore, compute from response
          hasMore: r.data.length > 0,
        })),
      ),
    onFirstPageLoaded: () => this.initialLoad.markLoaded('details'),
    onError: (err) => this.handleError('Failed to load table data.', err),
  });

  // Expose pagination signals for template
  protected allRows = this.pagination.rows;
  protected tableTotalRows = this.pagination.total;
  protected tableHasMore = this.pagination.hasMore;
  protected tableLoadingMore = this.pagination.isLoadingMore;

  /** Visible column IDs derived from currentViewService */
  protected visibleColumnIds = computed(() =>
    this.currentViewService.columns().map((col) => col.field),
  );

  /** Charts derived from summary data and view configuration */
  protected charts = computed<Chart[]>(() => {
    const summaries = this.summary().summaries;
    const stackedSummaries = this.summary().stackedSummaries ?? {};
    const views = this.currentViewService.charts();

    return views.map((view) => {
      const config = view.options as ChartConfig;
      const summaryData = summaries[view.id] || [];

      // Check if data in summaries has stack property (backend returns stacked data there)
      const hasStackInSummaries =
        summaryData.length > 0 && 'stack' in summaryData[0] && summaryData[0].stack;

      // Use stackedSummaries if available, otherwise check if summaries data is stacked
      let stackedData = stackedSummaries[view.id];
      if (!stackedData && hasStackInSummaries) {
        // Backend returned stacked data in summaries with {name, stack, value}
        // Convert to expected format {category, stack, value}
        stackedData = (
          summaryData as unknown as { name: string; stack: string; value: number }[]
        ).map((item) => ({
          category: item.name,
          stack: item.stack,
          value: item.value,
        }));
      }

      return {
        id: view.id,
        config: config,
        data: hasStackInSummaries ? [] : summaryData, // Don't pass as regular data if it's stacked
        stackedData: stackedData,
      };
    });
  });

  /** Error messages to display in the report */
  protected errors = signal<string[]>([]);

  /** Summary data from getSummaries() */
  protected summary = signal<ContentInsightsSummaries>({ callouts: {}, summaries: {} });

  /** Initial load tracker for the report */
  private initialLoad = createInitialLoadTracker('Content Report', 'fields', 'summary', 'details');

  /** Combined loading state for the report overlay */
  protected reportLoading = this.initialLoad.isLoading;

  /** Callout values derived from summary */
  protected callouts = computed(() => this.summary().callouts);

  /**
   * Callout items based on the current view configuration.
   * Returns CalloutConfig[] for the callout-section component.
   */
  protected calloutItems = computed<CalloutConfig[]>(() => {
    const viewCallouts = this.currentViewService.callouts();
    return viewCallouts.filter((id) => id in CALLOUT_CONFIG).map((id) => CALLOUT_CONFIG[id]);
  });

  /** Tracks whether context has been set */
  private contextReady = signal(false);

  /** Counter to trigger summary refetch (incremented on context change/retry) */
  private summaryRefreshTrigger = signal(0);

  /** Previous summary request key for change detection */
  private prevSummaryRequestKey = '';

  constructor() {
    this.buildColumns();
    this.loadFields();

    // Set context on service when it changes
    let previousContext: Context | null = null;
    let isInitialContext = true;
    effect(() => {
      const context = this.context();
      if (!contextEquals(context, previousContext)) {
        const wasContextChange = previousContext !== null;
        previousContext = context;
        untracked(() => {
          this.service.setContext(context);
          if (context) {
            this.contextReady.set(true);
            // Trigger refetch on context CHANGE (not initial set)
            // Initial fetch is handled by the summary effect
            if (wasContextChange && !isInitialContext) {
              this.summaryRefreshTrigger.update((n) => n + 1);
            }
            isInitialContext = false;
          }
        });
      }
    });

    // Summary fetch effect - handles ALL summary fetching
    // Waits for both viewReady and contextReady before fetching
    // Also refetches when summaryRefreshTrigger changes (context change/retry)
    // Only refetches when data-affecting properties change (not display-only like title, width)
    effect(() => {
      const viewReady = this.currentViewService.viewReady();
      const contextReady = this.contextReady();
      if (!viewReady || !contextReady) return;

      // Read refresh trigger to re-run effect on context change/retry
      const refreshTrigger = this.summaryRefreshTrigger();

      const filters = this.currentViewService.filters();
      const charts = this.currentViewService.charts();
      const callouts = this.currentViewService.callouts() as CalloutTypes[];

      // Build a key from only the data-affecting properties
      // Display properties (title, description, chartType, width, height, limitResults) are excluded
      const summaryRequestKey = JSON.stringify({
        refreshTrigger,
        filters,
        callouts,
        charts: charts.map((c) => ({
          id: c.id,
          type: c.type,
          field: c.field,
          stackBy: (c.options as Record<string, unknown>)?.['stackBy'],
          timeBucket: (c.options as Record<string, unknown>)?.['timeBucket'],
        })),
      });

      // Skip fetch if data-affecting properties haven't changed
      if (summaryRequestKey === this.prevSummaryRequestKey) return;
      this.prevSummaryRequestKey = summaryRequestKey;

      untracked(() => this.fetchSummary(filters, charts, callouts));
    });
  }

  /** Log error and add message to errors signal */
  private handleError(message: string, err: unknown): void {
    console.error(message, err);
    this.errors.update((errs) => [...errs, message]);
  }

  /** Load dynamic metadata fields and combine with static fields */
  private loadFields(): void {
    this.metadataService
      .getFields()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fields) => {
          this.allFields.set(
            [...STATIC_FILTER_FIELDS, ...fields].sort((a, b) =>
              a.displayName.localeCompare(b.displayName),
            ),
          );
          this.initialLoad.markLoaded('fields');
        },
        error: (err) => {
          this.handleError('Failed to load field configuration.', err);
          this.initialLoad.markLoaded('fields');
        },
      });
  }

  /** Fetch summary data using filters, charts, and callouts */
  private fetchSummary(
    filters: ViewFilter[],
    charts: InsightsViewChart[],
    callouts: CalloutTypes[],
  ): void {
    const summaries = adaptViewCharts(charts);

    this.service
      .getSummaries(filters, summaries, callouts)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (resp.error) {
            this.errors.update((errs) => [...errs, resp.error as string]);
            this.summary.set({ callouts: {}, summaries: {} });
          } else {
            this.summary.set(resp);
          }
          this.initialLoad.markLoaded('summary');
        },
        error: (err) => {
          this.handleError('Failed to load summary data. Please try again.', err);
          this.summary.set({ callouts: {}, summaries: {} });
          this.initialLoad.markLoaded('summary');
        },
      });
  }

  buildColumns(): void {
    const metadataColumns$ = this.columnConfigFactory.buildMetadataColumns<ContentInsightDetail>(
      (key, row) => (row[key] as string) ?? '-',
    );

    metadataColumns$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((metadataColumns) => {
      const searchFieldSet = new Set(this.searchFields());
      const systemCols = SYSTEM_FIELDS_COL_DEFS(searchFieldSet);

      // Convert metadata columns to use TextCellComponent
      const updatedMetadataCols = metadataColumns.map((col) => ({
        ...col,
        cellComponent: {
          type: TextCellComponent,
          inputs: (row: ContentInsightDetail) => ({ value: (row[col.id] as string) ?? '-' }),
        },
        cellTemplate: undefined,
      }));

      this.columns.set([...systemCols, ...updatedMetadataCols]);
    });
  }

  /** Active filters projected from CurrentViewService */
  protected activeFilters = computed(() => this.currentViewService.filters());

  filtersChanged(filters: ViewFilter[]): void {
    this.currentViewService.setFilters(filters);
  }

  removeChart($event: Chart) {
    this.currentViewService.setCharts(
      [...this.currentViewService.charts()].filter((c) => c.id !== $event.id),
    );
  }

  addChart(event: AddChartEvent) {
    const newChart = {
      id: crypto.randomUUID(),
      type: event.config.measure,
      field: event.config.groupBy,
      options: event.config,
    };

    const currentCharts = [...this.currentViewService.charts()];

    if (event.insertIndex !== undefined) {
      currentCharts.splice(event.insertIndex, 0, newChart);
    } else {
      currentCharts.push(newChart);
    }

    this.currentViewService.setCharts(currentCharts);
  }

  updateChart(event: ChartUpdateEvent) {
    const currentCharts = this.currentViewService.charts();
    const updatedCharts = currentCharts.map((chart) =>
      chart.id === event.id
        ? {
            ...chart,
            type: event.config.measure,
            field: event.config.groupBy,
            options: event.config,
          }
        : chart,
    );
    this.currentViewService.setCharts(updatedCharts);
  }

  onChartsReorder(charts: Chart[]) {
    // Update view service with reordered charts - computed will recalculate
    this.currentViewService.setCharts(
      charts.map((chart) => ({
        id: chart.id,
        type: chart.config.measure,
        field: chart.config.groupBy,
        options: chart.config,
      })),
    );
  }

  getRowKey(row: ContentInsightDetail): string {
    return row.resourceUuid;
  }

  async downloadCsv(visibleColumns: string[]): Promise<void> {
    const columns = visibleColumns.map((col) => ({ id: col, displayName: col }));
    const sort = adaptViewSortToTableSort(this.currentViewService.sorts());
    try {
      await this.service.downloadCsv(this.currentViewService.filters(), columns, sort);
    } catch {
      this.notificationService.error('Failed to download CSV', () =>
        this.downloadCsv(visibleColumns),
      );
    }
  }

  onSorted(sort: Sort) {
    if (sort.column) {
      this.currentViewService.setSorts([
        {
          field: sort.column,
          ascending: sort.direction === 'asc',
        },
      ]);
    } else {
      this.currentViewService.setSorts([]);
    }
  }

  onVisibleColumnsChange($event: string[]) {
    this.currentViewService.setColumns($event.map((id) => ({ field: id })));
  }

  /** Load next page for infinite scroll */
  protected loadNextPage = this.pagination.loadMore;

  /** Refresh all views data - called on retry */
  protected refreshViews(): void {
    this.errors.set([]);
    // Refresh cached metadata (fields, taxonomy options, file statuses)
    this.metadataService.refreshMetadataConfiguration();
    this.loadFields();
    this.pagination.refresh();
    // Trigger the summary effect to refetch
    this.summaryRefreshTrigger.update((n) => n + 1);
  }
}
