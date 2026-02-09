import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  output,
  signal,
  effect,
  computed,
  inject,
  Type,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  PopupMenuComponent,
  PopupMenuItemComponent,
  PopupMenuTriggerDirective,
  PopupSubmenuComponent,
} from '../ccms-popup-menu';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardComponent } from '../card/card';

const ICON_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download w-4 h-4" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>`;

/** Configuration for component-based cell rendering */
export interface CellComponentDef<T> {
  type: Type<unknown>;
  /** Maps row data to component inputs */
  inputs: (row: T) => Record<string, unknown>;
}

export interface ColumnDef<T> {
  id: string;
  label: string;
  dropdownGroup?: string; // the submenu to display this column under otherwise it's top level
  visible: boolean;
  removable: boolean;
  sortable: boolean;
  sortField?: string; // field to sort by (defaults to id if not specified)
  showOnHover: boolean; // cell is hidden until row is hovered. column header is always hidden
  textSearchable: boolean;
  textSearchHint?: string;
  /** Renders cell using a template or string */
  cellTemplate?: (obj: T) => TemplateRef<unknown> | string;
  /** Renders cell using a component (alternative to cellTemplate) */
  cellComponent?: CellComponentDef<T>;
  /** Optional CSS class(es) to wrap string cell content. Can be static or dynamic based on row data. */
  cellWrapperClass?: string | ((obj: T) => string);
}

export type Sort = { column: string | null; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

function reverseSort(sort: Sort): Sort {
  return sort.direction === 'asc'
    ? { column: sort.column, direction: 'desc' }
    : { column: sort.column, direction: 'asc' };
}

interface MenuData<T> {
  items: ColumnDef<T>[]; // top-level items (no dropdownGroup)
  groups: { label: string; items: ColumnDef<T>[] }[]; // grouped items
}

@Component({
  selector: 'ccms-rich-table',
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    PopupMenuItemComponent,
    PopupMenuComponent,
    PopupMenuTriggerDirective,
    PopupSubmenuComponent,
    CardComponent,
  ],
  templateUrl: './rich-table.html',
  styleUrl: './rich-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTableComponent<T> implements AfterViewInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);

  @ViewChild('loadMoreSentinel', { static: false })
  private sentinelRef?: ElementRef<HTMLDivElement>;

  @ViewChild('tableContainer', { static: false })
  private tableContainerRef?: ElementRef<HTMLDivElement>;

  private observer?: IntersectionObserver;

  protected readonly iconDownload: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(ICON_DOWNLOAD);

  columnDefs = input.required<ColumnDef<T>[]>();
  showAddColumnButton = input<boolean>(true);
  data = input.required<T[]>();
  sort = input<Sort>({ column: null, direction: 'asc' });
  enableDownloadCsv = input<boolean>(false);
  loading = input<boolean>(true);
  hasMore = input<boolean>(true);
  loadingMore = input<boolean>(false);
  totalRows = input<number | undefined>();
  rowKeyProvider = input.required<(row: T) => string>();
  // a function that returns a promise that resolves when the download is finished
  // the promise drives the loading visuals
  downloadCsv = input<(visibleColumns: string[]) => Promise<void>>();

  // Controlled mode: if provided, parent manages visible column IDs
  // Uncontrolled mode: if undefined, component manages visibility internally
  visibleColumnIds = input<string[]>();

  sorted = output<Sort>();
  loadMore = output<void>();
  searchTextChanged = output<{ columnId: string; searchText: string }>();
  // Emits when visible columns change (for controlled mode or parent observation)
  visibleColumnIdsChange = output<string[]>();

  // Internal state for uncontrolled mode (stores column IDs)
  private _internalVisibleColumnIds = signal<string[]>([]);

  // Effective visible column IDs (from input in controlled mode, from internal state in uncontrolled)
  private effectiveVisibleColumnIds = computed(() => {
    const controlled = this.visibleColumnIds();
    return controlled !== undefined ? controlled : this._internalVisibleColumnIds();
  });

  // Visible columns derived from effective IDs
  visibleColumns = computed(() => {
    const ids = this.effectiveVisibleColumnIds();
    const cols = this.columnDefs();
    return cols ? cols.filter((col) => ids.includes(col.id)) : [];
  });

  isDownloadingCsv = signal<boolean>(false);

  hiddenColumns = computed(() => {
    const cols = this.columnDefs();
    return cols ? cols.filter((col) => this.isColumnHidden(col)) : [];
  });

  /** Whether any visible column has text search enabled */
  protected hasSearchableColumns = computed(() => {
    return this.visibleColumns().some((col) => col.textSearchable);
  });

  constructor() {
    // Initialize/sync internal state from columnDefs (uncontrolled mode only)
    effect(() => {
      const cols = this.columnDefs();
      const controlled = this.visibleColumnIds();
      // Only sync if in uncontrolled mode
      if (cols && controlled === undefined) {
        this._internalVisibleColumnIds.set(cols.filter((col) => col.visible).map((col) => col.id));
      }
    });
  }

  visibleColumnsOrdered(): ColumnDef<T>[] {
    const cols = this.columnDefs();
    return cols ? cols.filter((col) => this.isColumnVisible(col)) : [];
  }

  isTemplate(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }

  /** Gets the cell content for template-based cells */
  getCellContent(column: ColumnDef<T>, row: T): TemplateRef<unknown> | string | null {
    if (column.cellTemplate) {
      return column.cellTemplate(row);
    }
    return null;
  }

  /** Gets the component inputs for component-based cells */
  getComponentInputs(column: ColumnDef<T>, row: T): Record<string, unknown> {
    return column.cellComponent?.inputs(row) ?? {};
  }

  onColumnHeaderClick(column: ColumnDef<T>): void {
    if (!column.sortable) {
      return; // Ignore clicks on non-sortable columns
    }

    const sortField = column.sortField ?? column.id;
    const isColumnPreviouslySorted = this.sort().column === sortField;
    const newSort: Sort = isColumnPreviouslySorted
      ? reverseSort(this.sort())
      : { column: sortField, direction: 'asc' };

    // Scroll table content to top when sort changes
    this.tableContainerRef?.nativeElement.scrollTo({ top: 0 });

    this.sorted.emit(newSort);
  }

  isSorted(column: ColumnDef<T>): boolean {
    const sortField = column.sortField ?? column.id;
    return this.sort().column === sortField;
  }

  getSortDirection(column: ColumnDef<T>): SortDirection | undefined {
    return this.isSorted(column) ? this.sort().direction : undefined;
  }

  hideColumn(hide: ColumnDef<T>): void {
    const currentIds = this.effectiveVisibleColumnIds();
    const newIds = currentIds.filter((id) => id !== hide.id);

    // Update internal state in uncontrolled mode
    if (this.visibleColumnIds() === undefined) {
      this._internalVisibleColumnIds.set(newIds);
    }
    this.visibleColumnIdsChange.emit(newIds);
  }

  showColumn(show: ColumnDef<T>): void {
    const currentIds = this.effectiveVisibleColumnIds();
    const newIds = [...currentIds, show.id];

    // Update internal state in uncontrolled mode
    if (this.visibleColumnIds() === undefined) {
      this._internalVisibleColumnIds.set(newIds);
    }
    this.visibleColumnIdsChange.emit(newIds);
  }

  isColumnHidden(column: ColumnDef<T>): boolean {
    return !this.visibleColumns().includes(column);
  }

  isColumnVisible(column: ColumnDef<T>): boolean {
    return this.visibleColumns().includes(column);
  }

  // organize column data in a useful structure for rendering
  menuData(): MenuData<T> {
    const items: ColumnDef<T>[] = [];
    const groupMap: Record<string, ColumnDef<T>[]> = {};

    for (const col of this.hiddenColumns()) {
      if (col.dropdownGroup) {
        if (!groupMap[col.dropdownGroup]) groupMap[col.dropdownGroup] = [];
        groupMap[col.dropdownGroup].push(col);
      } else {
        items.push(col);
      }
    }

    const groups = Object.entries(groupMap).map(([label, items]) => ({ label, items }));

    return { items, groups };
  }

  async handleCsvDownload() {
    const download = this.downloadCsv();
    if (!download) {
      return;
    }
    this.isDownloadingCsv.set(true);
    try {
      await download(this.visibleColumnsOrderedIds());
    } finally {
      this.isDownloadingCsv.set(false);
    }
  }

  ngAfterViewInit(): void {
    // Delay to ensure sentinel is rendered
    setTimeout(() => this.setupInfiniteScroll(), 0);
  }

  private setupInfiniteScroll(): void {
    if (this.observer || !this.sentinelRef) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.hasMore() && !this.loading() && !this.loadingMore()) {
            this.loadMore.emit();
          }
        });
      },
      { rootMargin: '0px', threshold: [0, 0.1] },
    );

    this.observer.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private visibleColumnsOrderedIds(): string[] {
    return this.visibleColumnsOrdered().map((col) => col.id);
  }

  onSearchTextChange(column: ColumnDef<T>, $event: Event) {
    this.searchTextChanged.emit({
      columnId: column.id,
      searchText: ($event.target as HTMLInputElement).value,
    });
  }

  getKeyForRow(row: T): string {
    return this.rowKeyProvider()(row);
  }

  protected getCellWrapperClass(colDef: ColumnDef<T>, row: T): string {
    if (!colDef.cellWrapperClass) {
      return '';
    }
    return typeof colDef.cellWrapperClass === 'function'
      ? colDef.cellWrapperClass(row)
      : colDef.cellWrapperClass;
  }
}
