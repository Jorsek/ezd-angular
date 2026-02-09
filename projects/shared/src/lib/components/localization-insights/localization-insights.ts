import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  computed,
  OnInit,
  untracked,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { of } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createPaginatedResource } from '../../utils/paginated-resource';
import { createInitialLoadTracker } from '@ccms/utils/initial-load-tracker';
import {
  LocalizationInsightsService,
  SummarySpec,
  CsvColumn,
} from '../../services/localization-insights/localization-insights.service';
import { MetadataConfigurationService } from '../../services/metadata/metadata-configuration.service';
import { LocaleSummaryResponse } from '../../models/locale-summary-response.interface';
import {
  RESOURCE_STATUS_VALUES,
  RESOURCE_DUE_VALUES,
  JOB_STATUS_VALUES,
} from '../../models/localization-insights.interface';
import { Field, FieldType } from '../../models/filter-field.interface';
import { FilterCategory } from '../../models/filter.interface';
import { injectFilterBuilder } from '../../utils/filter-builder';
import {
  STATIC_LOCALIZATION_FILTERS,
  DEFAULT_LOCALIZATION_VIEW,
  LOCALIZATION_SYSTEM_FIELDS,
} from './localization-insights-constants';
import {
  Chart,
  ChartUpdateEvent,
  CustomChartListComponent,
} from '../content-report/custom-chart-list/custom-chart-list';
import { ChartConfig } from '../content-report/configure-chart/configure-chart';
import { CHART_COLORS } from '../../constants/localization-chart-colors';
import { FilterSectionComponent } from './filter-section/filter-section';
import { ViewFilter, InsightsViewChart, CurrentViewService } from '../insights-views';
import { CalloutSectionComponent } from '../reporting/callout-section/callout-section';
import { CalloutConfig } from '../reporting/callout-section/callout-config.interface';
import { CcmsReportComponent } from '../ccms-report';
import { Context, ContextType, contextEquals } from '../../models/server-context.interface';
import { LocalizationDetailRow } from '../../models/locale-detail-response.interface';
import { RichTableComponent, ColumnDef, Sort } from '../table/rich-table';
import { NotificationService, NotificationOutletComponent } from '../ccms-notifications';
import {
  LinkCellComponent,
  StatusCellComponent,
  HighlightCellComponent,
} from '../reporting/cell-renderers';

/**
 * Localization Insights Component
 *
 * Dashboard for monitoring and managing localization status across all projects.
 * Displays summary statistics, charts, and a detailed data table with filtering,
 * sorting, and infinite scroll support.
 *
 * @example
 * ```html
 * <ccms-localization-insights />
 * ```
 */
@Component({
  selector: 'ccms-localization-insights',
  imports: [
    CcmsReportComponent,
    FilterSectionComponent,
    RichTableComponent,
    CustomChartListComponent,
    CalloutSectionComponent,
    NotificationOutletComponent,
  ],
  templateUrl: './localization-insights.html',
  styleUrl: './localization-insights.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [LocalizationInsightsService, CurrentViewService, NotificationService],
})
export class LocalizationInsightsComponent implements OnInit {
  // ──────────────────────────────── INPUTS ────────────────────────────────
  contextUuid = input<string>();
  contextType = input<ContextType>('folder');
  showHeader = input<boolean>(true);
  showBorder = input<boolean>(true);

  // ──────────────────────────────── INJECTIONS ────────────────────────────────
  protected service = inject(LocalizationInsightsService);
  protected currentViewService = inject(CurrentViewService);
  private destroyRef = inject(DestroyRef);
  private metadataConfigService = inject(MetadataConfigurationService);
  private notificationService = inject(NotificationService);
  private createFilterBuilder = injectFilterBuilder();

  // ──────────────────────────────── CELL TEMPLATES ────────────────────────────────
  @ViewChild('jobsCell', { static: true }) jobsCell!: TemplateRef<{
    row: LocalizationDetailRow;
  }>;

  // ──────────────────────────────── CONTEXT ────────────────────────────────
  protected context = computed<Context | null>(() => {
    const id = this.contextUuid();
    if (!id) return null;
    const type = this.contextType();
    return { type: type.toUpperCase() as 'MAP' | 'FOLDER' | 'BRANCH', id };
  });

  // ──────────────────────────────── VIEW STATE ────────────────────────────────
  protected readonly defaultView = DEFAULT_LOCALIZATION_VIEW;
  private viewRefreshed = signal(false);

  // ──────────────────────────────── INITIAL LOAD TRACKER ────────────────────────────────
  private initialLoad = createInitialLoadTracker(
    'Localization Report',
    'refresh',
    'fields',
    'summary',
    'details',
  );
  protected reportLoading = this.initialLoad.isLoading;

  // ──────────────────────────────── ERROR HANDLING ────────────────────────────────
  protected errors = signal<string[]>([]);

  /**
   * Log error and add user-friendly message to errors signal.
   */
  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.errors.update((errs) => [...errs, message]);
  }

  // ──────────────────────────────── FIELDS & COLUMNS ────────────────────────────────
  /** All available fields: system fields + dynamic metadata/computed fields */
  protected allFields = signal<Field[]>([...LOCALIZATION_SYSTEM_FIELDS]);

  /** Column definitions derived from system + metadata fields */
  protected columns = computed<ColumnDef<LocalizationDetailRow>[]>(() => {
    const searchableFields = new Set(this.searchFields());

    // System columns
    const systemCols = LOCALIZATION_SYSTEM_FIELDS.map((field): ColumnDef<LocalizationDetailRow> => {
      const base = {
        id: field.name,
        label: field.displayName,
        visible: field.visible,
        removable: field.removable,
        sortable: field.sortable,
        showOnHover: false,
        textSearchable: false,
      };

      switch (field.name) {
        case 'fileName':
          return {
            ...base,
            cellComponent: {
              type: LinkCellComponent,
              inputs: (row) => ({
                text: row['fileName'],
                resourceUuid: row['sourceResourceUuid'],
              }),
            },
          };
        case 'title':
          return searchableFields.has(field.name)
            ? {
                ...base,
                cellComponent: {
                  type: HighlightCellComponent,
                  inputs: (row) => ({ html: row[field.name] }),
                },
              }
            : { ...base, cellTemplate: (row) => (row[field.name] as string) ?? '-' };
        case 'locale':
          return {
            ...base,
            sortField: 'displayLocale',
            cellComponent: {
              type: LinkCellComponent,
              inputs: (row) => ({
                text: row['displayLocale'],
                resourceUuid: row['sourceResourceUuid'],
                locale: row['localizationLocaleCode'],
              }),
            },
          };
        case 'jobs':
          return { ...base, cellTemplate: () => this.jobsCell };
        case 'fileStatus':
          return {
            ...base,
            sortField: 'metadata:status',
            cellComponent: {
              type: StatusCellComponent,
              inputs: (row) => ({
                value: row['metadata:status'],
                type: 'fileStatus',
              }),
            },
          };
        case 'l10nStatus':
          return {
            ...base,
            sortField: 'localizedResourceStatus',
            cellComponent: {
              type: StatusCellComponent,
              inputs: (row) => ({
                value: row['localizedResourceStatus'],
                type: 'l10nStatus',
              }),
            },
          };
        case 'dueDate':
          return {
            ...base,
            sortField: 'dueUtc',
            cellTemplate: (row) => {
              const val = row['dueUtc'] as string | undefined;
              return val ? new Date(val).toLocaleString() : '-';
            },
          };
        case 'wordCount':
        case 'charCount':
          return {
            ...base,
            cellTemplate: (row) => (row[field.name] as number)?.toString() ?? '-',
          };
        case 'mimeType':
          return searchableFields.has(field.name)
            ? {
                ...base,
                cellComponent: {
                  type: HighlightCellComponent,
                  inputs: (row) => ({ html: row[field.name] }),
                },
              }
            : { ...base, cellTemplate: (row) => (row[field.name] as string) ?? '-' };
        default:
          return { ...base, cellTemplate: (row) => (row[field.name] as string) ?? '-' };
      }
    });

    // Metadata columns (fields that are metadata or computed)
    const metadataFields = this.allFields().filter((f) => f.metadata || f.computed);
    const metadataCols = metadataFields.map((field): ColumnDef<LocalizationDetailRow> => {
      const base = {
        id: field.name,
        label: field.displayName,
        dropdownGroup: field.computed ? 'Computed' : 'Metadata',
        visible: false,
        removable: true,
        sortable: true,
        showOnHover: false,
        textSearchable: false,
      };

      return searchableFields.has(field.name)
        ? {
            ...base,
            cellComponent: {
              type: HighlightCellComponent,
              inputs: (row) => ({ html: row[field.name] }),
            },
          }
        : { ...base, cellTemplate: (row) => this.formatFieldValue(row[field.name], field.type) };
    });

    return [...systemCols, ...metadataCols];
  });

  protected visibleColumnIds = computed(() =>
    this.currentViewService.columns().map((col) => col.field),
  );

  // ──────────────────────────────── FILTERS ────────────────────────────────
  private staticFilters = this.buildStaticFilters();

  protected filters = computed<FilterCategory[]>(() => {
    const metadataFields = this.allFields().filter((f) => f.metadata || f.computed);
    const ctx = this.context();
    const localizationFilters = ctx
      ? this.staticFilters.filter((f) => f.id !== 'map')
      : this.staticFilters;
    const builder = this.createFilterBuilder();

    // Add metadata/computed fields with distinct values for text types
    for (const field of metadataFields) {
      if (field.type === 'text') {
        // Use list filter with distinct values from the service
        builder.addField(field, {
          type: 'list',
          selectionMode: 'multi',
          searchable: true,
          options: () =>
            this.service
              .getDistinctValues(field.name)
              .pipe(map((values) => values.map((v) => ({ value: v, label: v })))),
        });
      } else {
        builder.addField(field);
      }
    }

    return [...localizationFilters, ...builder.build()];
  });

  protected activeFilters = computed(() => this.currentViewService.filters());

  protected searchFields = computed(() => {
    const columns = this.currentViewService.viewReady() ? this.currentViewService.columns() : [];
    const visibleFields = new Set(columns.map((col) => col.field));
    return this.allFields()
      .filter((f) => f.type === 'text' && visibleFields.has(f.name))
      .map((f) => f.name);
  });

  // ──────────────────────────────── SORT ────────────────────────────────
  private sort = computed(() => {
    const sorts = this.currentViewService.sorts();
    if (sorts.length === 0) {
      return { column: null as string | null, direction: 'asc' as const };
    }
    return {
      column: sorts[0].field as string | null,
      direction: (sorts[0].ascending ? 'asc' : 'desc') as 'asc' | 'desc',
    };
  });

  protected detailsSort = computed<Sort>(() => ({
    column: this.sort().column,
    direction: this.sort().direction,
  }));

  // ──────────────────────────────── DETAILS DATA (paginated resource) ────────────────────────────────

  /** Paginated resource for table data */
  private pagination = createPaginatedResource<
    LocalizationDetailRow,
    { filters: ViewFilter[]; sort: Sort }
  >({
    params: () => {
      if (!this.currentViewService.viewReady() || !this.viewRefreshed()) return null;
      return {
        filters: this.currentViewService.filters(),
        sort: this.sort(),
      };
    },
    fetch: (params, page) =>
      this.service
        .details(params.filters, params.sort, page)
        .pipe(map((r) => ({ rows: r.rows, total: r.totalCount, hasMore: r.hasMore }))),
    onFirstPageLoaded: () => this.initialLoad.markLoaded('details'),
    onError: (err, page) => this.handleError(`Failed to load page ${page + 1} of table data`, err),
  });

  // Expose pagination signals for template
  protected detailsData = this.pagination.rows;
  protected detailsHasMore = this.pagination.hasMore;
  protected detailsTotal = this.pagination.total;
  protected detailsLoadingMore = this.pagination.isLoadingMore;

  // ──────────────────────────────── SUMMARY DATA ────────────────────────────────
  protected summaryData = signal<LocaleSummaryResponse | null>(null);

  // ──────────────────────────────── CHARTS ────────────────────────────────
  /** L10N status color map for semantic colors */
  private readonly L10N_STATUS_COLOR_MAP: Record<string, string> = {
    CURRENT: CHART_COLORS.CURRENT,
    MISSING: CHART_COLORS.MISSING,
    OUTDATED: CHART_COLORS.OUTDATED,
  };

  /** Charts derived from summary data and view configuration */
  protected charts = computed<Chart[]>(() => {
    const summaryData = this.summaryData();
    const summaries = summaryData?.summaries ?? {};
    const stackedSummaries = summaryData?.stackedSummaries ?? {};
    const views = this.currentViewService.charts();

    return views.map((view) => {
      const config = view.options as ChartConfig;
      const summaryResult = summaries[view.id] || [];

      // Check if data has stack property (stacked bar chart)
      const hasStackInSummaries =
        summaryResult.length > 0 && 'stack' in summaryResult[0] && summaryResult[0].stack;

      let stackedData = stackedSummaries[view.id];
      if (!stackedData && hasStackInSummaries) {
        stackedData = (summaryResult as { name: string; stack: string; value: number }[]).map(
          (item) => ({
            category: item.name,
            stack: item.stack,
            value: item.value,
          }),
        );
      }

      // Apply semantic colors for L10N status fields
      const isStatusField =
        config.groupBy === 'resourceStatus' || config.stackBy === 'resourceStatus';
      const colorMap = isStatusField ? this.L10N_STATUS_COLOR_MAP : undefined;

      return {
        id: view.id,
        config: config,
        data: hasStackInSummaries ? [] : summaryResult,
        stackedData: stackedData,
        colorMap: colorMap,
      };
    });
  });

  protected readonly calloutItems: CalloutConfig[] = [
    { id: 'TOTAL_RESOURCES', label: 'Localized Files', icon: 'file-text' },
    { id: 'TOTAL_WORDS', label: 'Total Words', icon: 'file-text' },
    { id: 'TOTAL_JOBS', label: 'Total Jobs', icon: 'briefcase' },
    { id: 'TOTAL_LOCALES', label: 'Locales', icon: 'globe' },
  ];

  protected calloutValues = computed<Record<string, number>>(() => {
    const data = this.summaryData();
    return data?.callouts ? { ...data.callouts } : {};
  });

  // ──────────────────────────────── CONSTRUCTOR ────────────────────────────────
  constructor() {
    // Set context on service when it changes
    let previousContext: Context | null = null;
    effect(() => {
      const context = this.context();
      if (!contextEquals(context, previousContext)) {
        previousContext = context;
        untracked(() => {
          this.service.setContext(context);
        });
      }
    });

    // Summary fetch effect - requires both view ready and data refreshed
    // Note: CurrentViewService uses deep equality on these signals, so this effect
    // only runs when the actual values change, not when other view parts (like sorts) change
    effect(() => {
      const viewReady = this.currentViewService.viewReady();
      const refreshed = this.viewRefreshed();
      if (!viewReady || !refreshed) return;
      const filters = this.currentViewService.filters();
      const charts = this.currentViewService.charts();
      const callouts = this.currentViewService.callouts();

      untracked(() => this.fetchSummary(filters, charts, callouts));
    });
  }

  // ──────────────────────────────── TABLE HANDLERS ────────────────────────────────
  /** Row key provider for RichTable */
  protected getRowKey = (row: LocalizationDetailRow): string =>
    `${row['sourceResourceUuid']}-${row['localizationLocaleCode']}`;

  /** Load next page for infinite scroll */
  protected loadNextPage = this.pagination.loadMore;

  /** Handle visible columns change */
  protected onVisibleColumnsChange(columnIds: string[]): void {
    this.currentViewService.setColumns(columnIds.map((field) => ({ field })));
  }

  /** Handle sort change */
  protected onSorted(sort: Sort): void {
    if (sort.column) {
      this.currentViewService.setSortsFromTableSort({
        column: sort.column,
        direction: sort.direction,
      });
    }
  }

  /** CSV download (promise-based for RichTable) */
  protected downloadCsv = async (visibleColumnIds: string[]): Promise<void> => {
    const filters = this.currentViewService.filters();
    const csvColumns: CsvColumn[] = visibleColumnIds.map((id) => {
      const col = this.columns().find((c) => c.id === id);
      // Use sortField (actual server field) if available, otherwise use column id
      const serverId = col?.sortField ?? id;
      return {
        id: serverId,
        displayName: col?.label ?? id,
      };
    });

    try {
      await this.service.downloadCsv(filters, csvColumns, this.sort());
    } catch {
      this.notificationService.error('Failed to download CSV', () =>
        this.downloadCsv(visibleColumnIds),
      );
    }
  };

  /** Open GWT job popup */
  protected openJobPopup(jobId: number): void {
    const win = window as Window & {
      gwtCms?: { openLocalizationJobPopup?: (jobId: number) => void };
    };
    win.gwtCms?.openLocalizationJobPopup?.(jobId);
  }

  // ──────────────────────────────── CHART HANDLERS ────────────────────────────────
  /** Add a new chart */
  protected addChart(config: ChartConfig): void {
    this.currentViewService.setCharts([
      ...this.currentViewService.charts(),
      {
        id: crypto.randomUUID(),
        type: config.measure,
        field: config.groupBy,
        options: config,
      },
    ]);
  }

  /** Update an existing chart */
  protected updateChart(event: ChartUpdateEvent): void {
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

  /** Remove a chart */
  protected removeChart(chart: Chart): void {
    this.currentViewService.setCharts(
      this.currentViewService.charts().filter((c) => c.id !== chart.id),
    );
  }

  /** Reorder charts */
  protected onChartsReorder(charts: Chart[]): void {
    this.currentViewService.setCharts(
      charts.map((chart) => ({
        id: chart.id,
        type: chart.config.measure,
        field: chart.config.groupBy,
        options: chart.config,
      })),
    );
  }

  // ──────────────────────────────── LIFECYCLE ────────────────────────────────
  ngOnInit(): void {
    this.loadFields();
    setTimeout(() => this.refreshInsightsData(), 0);
  }

  // ──────────────────────────────── DATA LOADING ────────────────────────────────
  /** Load dynamic metadata fields and combine with system fields */
  private loadFields(): void {
    this.metadataConfigService
      .getFields()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fields) => {
          this.allFields.set([...LOCALIZATION_SYSTEM_FIELDS, ...fields]);
          this.initialLoad.markLoaded('fields');
        },
        error: (err) => {
          this.handleError('Failed to load field configuration', err);
          this.initialLoad.markLoaded('fields');
        },
      });
  }

  /**
   * Refresh insights data.
   * Always marks view as refreshed on completion, success or error.
   */
  protected refreshInsightsData(): void {
    this.service
      .refreshInsightsData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (!result.success) {
            console.warn('Refresh failed, insights data might be stale');
          }
          this.initialLoad.markLoaded('refresh');
          this.viewRefreshed.set(true);
        },
        error: (err) => {
          console.warn('Refresh request failed, continuing with potentially stale data', err);
          this.initialLoad.markLoaded('refresh');
          this.viewRefreshed.set(true);
        },
      });
  }

  /**
   * Fetch summary data with filters, charts, and callouts.
   */
  private fetchSummary(
    filters: ViewFilter[],
    charts: InsightsViewChart[],
    callouts: string[],
  ): void {
    const summaries = this.adaptChartsToSummaries(charts);
    this.service
      .getSummary(filters, summaries, callouts)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.error) {
            this.errors.update((errs) => [...errs, response.error]);
            this.summaryData.set(null);
          } else if (response.data) {
            this.summaryData.set(response.data);
          }
          this.initialLoad.markLoaded('summary');
        },
        error: (err) => {
          this.handleError('Failed to load summary data', err);
          this.summaryData.set(null);
          this.initialLoad.markLoaded('summary');
        },
      });
  }

  /**
   * Handle filter change events from the filter section.
   */
  protected filtersChanged(filters: ViewFilter[]): void {
    this.currentViewService.setFilters(filters);
  }

  /**
   * Refresh all views data - called on retry.
   * Clears errors and re-fetches data without showing full loading overlay.
   */
  protected refreshViews(): void {
    this.errors.set([]);

    // Refresh cached metadata (fields, taxonomy options, file statuses)
    this.metadataConfigService.refreshMetadataConfiguration();

    // Refetch all data
    this.loadFields();
    this.pagination.refresh();
    const filters = this.currentViewService.filters();
    const charts = this.currentViewService.charts();
    const callouts = this.currentViewService.callouts();
    this.fetchSummary(filters, charts, callouts);
  }

  // ──────────────────────────────── FILTER HELPERS ────────────────────────────────

  /**
   * Build static localization filters with options functions injected.
   */
  private buildStaticFilters(): FilterCategory[] {
    return STATIC_LOCALIZATION_FILTERS.map((filter) => {
      switch (filter.id) {
        case 'locale': {
          const options$ = this.service.getActiveLocales().pipe(
            map((locales) =>
              [...locales]
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((locale) => ({
                  value: locale.code,
                  label: `${locale.displayName} (${locale.code})`,
                })),
            ),
            shareReplay(1),
          );
          return { ...filter, options: () => options$ };
        }

        case 'localizedStatus':
          return {
            ...filter,
            options: () =>
              of(RESOURCE_STATUS_VALUES.map((s) => ({ value: s.value, label: s.label }))),
          };

        case 'fileStatus': {
          const options$ = this.metadataConfigService.getFileStatuses().pipe(
            take(1),
            map((statuses) => statuses.map((s) => ({ value: s.name, label: s.displayName }))),
            shareReplay(1),
          );
          return { ...filter, options: () => options$ };
        }

        case 'map': {
          const options$ = this.service.getRootMaps().pipe(
            map((rootMaps) =>
              rootMaps.map((rm) => ({
                value: rm.resourceUuid,
                label: rm.resourceTitle || rm.resourceUri,
                title: rm.resourceUri,
              })),
            ),
            shareReplay(1),
          );
          return { ...filter, options: () => options$ };
        }

        case 'due':
          return {
            ...filter,
            options: () =>
              of(RESOURCE_DUE_VALUES.map((value) => ({ value, label: this.formatInitCap(value) }))),
          };

        case 'job': {
          const options$ = this.service.getJobs().pipe(
            map((jobs) =>
              jobs.map((job) => ({
                value: job.id.toString(),
                label: `${job.id} - ${job.filename}`,
              })),
            ),
            shareReplay(1),
          );
          return { ...filter, options: () => options$ };
        }

        case 'jobStatus':
          return {
            ...filter,
            options: () =>
              of(JOB_STATUS_VALUES.map((value) => ({ value, label: this.formatInitCap(value) }))),
          };

        default:
          return { ...filter };
      }
    });
  }

  /**
   * Convert InsightsViewChart[] to summary specifications for the backend.
   */
  private adaptChartsToSummaries(charts: InsightsViewChart[]): Record<string, SummarySpec> {
    const result: Record<string, SummarySpec> = {};
    for (const chart of charts) {
      const options = chart.options as Record<string, unknown> | undefined;
      const spec: SummarySpec = {
        type: chart.type,
        field: chart.field,
      };
      if (options?.['stackBy']) {
        spec.stackBy = options['stackBy'] as string;
      }
      if (options?.['timeBucket']) {
        spec.bucket = options['timeBucket'] as string;
      }
      result[chart.id] = spec;
    }
    return result;
  }

  /**
   * Format a string to init cap (e.g., 'THIS_WEEK' -> 'This Week').
   */
  private formatInitCap(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format a field value based on its type.
   * Handles both single values and arrays.
   */
  private formatFieldValue(value: unknown, fieldType: FieldType): string {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    // Handle arrays - format each value and join with comma
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      return value.map((v) => this.formatSingleValue(String(v), fieldType)).join(', ');
    }

    return this.formatSingleValue(String(value), fieldType);
  }

  /**
   * Format a single value based on its type.
   */
  private formatSingleValue(value: string, fieldType: FieldType): string {
    switch (fieldType) {
      case 'datetime': {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString();
      }
      case 'boolean':
        return value.toLowerCase() === 'true' ? 'Yes' : 'No';
      case 'number': {
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toLocaleString();
      }
      default:
        return value;
    }
  }
}
