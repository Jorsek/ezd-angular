import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ColumnDef, RichTableComponent, Sort } from '../table/rich-table';
import { QualityIssue, QualityReportService } from './quality-report.service';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { createPaginatedResource } from '../../utils/paginated-resource';
import {
  TabButtonComponent,
  TabContentComponent,
  TabsComponent,
  TabsHeaderComponent,
} from '../tabs/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OPEN_EXTERNAL } from './icons.const';
import {
  objectToSeries,
  summariesToCategoryTrendData,
  summariesToIssuesOverTimeData,
  summariesToSeverityTrendData,
} from './echarts-data-mapper';
import { enumToFriendly } from '../../utils/text.util';
import { BarChartComponent } from '../charts/bar-chart/bar-chart';
import { DoughnutChartComponent } from '../charts/doughnut-chart/doughnut-chart';
import { LineChartComponent } from '../charts/line-chart/line-chart';
import { CcmsReportComponent } from '../ccms-report';
import { FilterSectionComponent } from '../localization-insights/filter-section/filter-section';
import { CurrentViewService, InsightsView, InsightsViewSort, ViewFilter } from '../insights-views';
import { FilterCategory } from '../../models/filter.interface';
import { adaptViewSortToTableSort } from '../content-report/insights-view-adapters';
import { CardComponent } from '../card/card';

const SEVERITY_CLASSES: Record<string, string> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'type',
    label: 'Type / Category',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    metadata: false,
    options: () =>
      of([
        { label: 'Validation & Structure', value: 'VALIDATION_AND_STRUCTURE' },
        { label: 'Linking', value: 'LINKING' },
        { label: 'Accessibility', value: 'ACCESSIBILITY' },
        { label: 'Localization Readiness', value: 'LOCALIZATION_READINESS' },
        { label: 'AI Readiness', value: 'AI_READINESS' },
        { label: 'Metadata & SEO', value: 'METADATA_AND_SEO' },
        { label: 'Governance & Lifecycle', value: 'GOVERNANCE_AND_LIFECYCLE' },
      ]),
  },
  {
    id: 'severity',
    label: 'Severity',
    type: 'list',
    default: true,
    removable: false,
    selectionMode: 'multi',
    searchable: false,
    metadata: false,
    options: () =>
      of([
        { label: 'Blocker', value: 'CRITICAL' },
        { label: 'Error', value: 'ERROR' },
        { label: 'Warning', value: 'WARNING' },
        { label: 'Info', value: 'INFO' },
      ]),
  },
];

const DEFAULT_VIEW: InsightsView = {
  id: 'default',
  insightType: 'QUALITY',
  name: 'Default View',
  description: 'The default content report view',
  shared: true,
  readOnly: true,
  callouts: [],
  charts: [],
  columns: [],
  filters: [],
  sorts: [],
};

@Component({
  selector: 'ccms-quality-report',
  templateUrl: './quality-report.html',
  imports: [
    RichTableComponent,
    TabsComponent,
    TabButtonComponent,
    TabContentComponent,
    TabsHeaderComponent,
    BarChartComponent,
    DoughnutChartComponent,
    LineChartComponent,
    CcmsReportComponent,
    FilterSectionComponent,
    CardComponent,
  ],
  providers: [CurrentViewService, QualityReportService],
  styleUrl: './quality-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class QualityReportComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly service = inject(QualityReportService);
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly currentViewService = inject(CurrentViewService);

  protected readonly openExternalIcon: SafeHtml =
    this.sanitizer.bypassSecurityTrustHtml(OPEN_EXTERNAL);

  @ViewChild('severityTemplate', { static: true })
  severityTemplate!: TemplateRef<QualityIssue>;

  @ViewChild('linkToEditorTemplate', { static: true })
  linkToEditorTemplate!: TemplateRef<QualityIssue>;

  @ViewChild('linkToEditorEttoTemplate', { static: true })
  linkToEditorEttoTemplate!: TemplateRef<QualityIssue>;

  readonly contextUuid = input<string>();

  readonly defaultView: InsightsView[] = [DEFAULT_VIEW];
  readonly filtersCats = FILTER_CATEGORIES;
  readonly enumToFriendly = enumToFriendly;

  readonly columnDefs: ColumnDef<QualityIssue>[] = [
    {
      id: 'file_name',
      label: 'Topic',
      visible: true,
      removable: false,
      sortable: true,
      textSearchable: true,
      showOnHover: false,
      textSearchHint: 'search topic',
      cellTemplate: (issue) => issue.resourceInfo.filename,
    },
    {
      id: 'severity',
      label: 'Severity',
      visible: true,
      removable: false,
      sortable: true,
      textSearchable: false,
      showOnHover: false,
      cellTemplate: () => this.severityTemplate,
    },
    {
      id: 'message',
      label: 'Message',
      visible: true,
      removable: false,
      sortable: true,
      textSearchable: true,
      showOnHover: false,
      cellTemplate: (issue) => issue.message,
    },
    {
      id: 'category',
      label: 'Category',
      visible: true,
      removable: false,
      sortable: true,
      textSearchable: false,
      showOnHover: false,
      cellTemplate: (issue) => enumToFriendly(issue.qualityCheck.category),
    },
    {
      id: 'link_to_editor',
      label: '',
      visible: true,
      removable: false,
      sortable: false,
      textSearchable: false,
      showOnHover: true,
      cellTemplate: () => this.linkToEditorTemplate,
    },
    {
      id: 'link_to_editor_etto',
      label: '',
      visible: true,
      removable: false,
      sortable: false,
      textSearchable: false,
      showOnHover: true,
      cellTemplate: () => this.linkToEditorEttoTemplate,
    },
  ];

  readonly filter = this.service.filter;
  readonly sort = computed(() => adaptViewSortToTableSort(this.currentViewService.sorts()));
  readonly activeFilters = computed(() => this.currentViewService.filters());

  // ──────────────────────────────── DETAILS DATA (paginated resource) ────────────────────────────────

  /** Params type for the paginated resource */
  private pagination = createPaginatedResource<
    QualityIssue,
    { filters: ViewFilter[]; sort: InsightsViewSort | undefined; contextId: string }
  >({
    params: () => {
      const contextId = this.service.contextResourceId();
      if (!contextId) return null;
      return {
        filters: this.currentViewService.filters(),
        sort: this.currentViewService.sorts()[0],
        contextId,
      };
    },
    fetch: (params, page) =>
      this.service
        .fetchPage(page, params.filters, params.sort)
        .pipe(map((r) => ({ rows: r.data, total: r.total, hasMore: r.hasMore }))),
    onError: (err) => this.handleError('Failed to load quality issues.', err),
  });

  // Expose pagination signals for template
  protected allRows = this.pagination.rows;
  protected totalRows = this.pagination.total;
  protected detailsHasMore = this.pagination.hasMore;
  protected detailsLoadingMore = this.pagination.isLoadingMore;

  /** Error messages for the report */
  protected errors = signal<string[]>([]);

  readonly counts = toSignal(this.service.counts$, {
    initialValue: { byCategory: {}, bySeverity: {} },
  });

  readonly summaries = toSignal(this.service.summaries$, { initialValue: [] });

  // Computed signals for chart data (avoid recalculating on every change detection)
  readonly categoryCount = computed(() => objectToSeries(this.counts().byCategory));
  readonly severityCount = computed(() => objectToSeries(this.counts().bySeverity));
  readonly categoryTrendData = computed(() => summariesToCategoryTrendData(this.summaries()));
  readonly severityTrendData = computed(() => summariesToSeverityTrendData(this.summaries()));
  readonly issuesOverTimeData = computed(() => summariesToIssuesOverTimeData(this.summaries()));

  constructor() {
    effect(() => {
      const contextUuid = this.contextUuid();
      if (contextUuid) {
        this.service.setContextResourceId(contextUuid);
      }
    });
  }

  ngOnInit() {
    // Expose refresh on the DOM element for GWT interop
    (this.el.nativeElement as HTMLElement & { refresh: () => void }).refresh =
      this.refresh.bind(this);
  }

  onSorted(sort: Sort) {
    this.currentViewService.setSortsFromTableSort(sort);
  }

  /** Load next page for infinite scroll */
  loadMore = this.pagination.loadMore;

  /** Called by GWT via JSNI to refresh the report after a quality scan completes */
  refresh() {
    this.errors.set([]);
    this.pagination.refresh();
    this.service.refresh();
  }

  /** Log error and add message to errors signal for display */
  private handleError(message: string, err: unknown): void {
    console.error(message, err);
    this.errors.update((errs) => [...errs, message]);
  }

  filtersChanged(filters: ViewFilter[]) {
    this.currentViewService.setFilters(filters);
  }

  searchTextChanged(event: { columnId: string; searchText: string }) {
    switch (event.columnId) {
      case 'file_name':
        this.service.setFileNameSearch(event.searchText);
        break;
      case 'message':
        this.service.setMessageSearch(event.searchText);
        break;
    }
  }

  getSeverityClass(severityCode: string): string | undefined {
    return SEVERITY_CLASSES[severityCode];
  }

  getRowKey(row: QualityIssue): string {
    return row.issueUuid;
  }
}
