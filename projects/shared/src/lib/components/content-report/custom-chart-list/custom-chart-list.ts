import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDragDrop, CdkDragMove, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PieChartComponent } from '../../charts/pie-chart/pie-chart';
import { BarChartComponent } from '../../charts/bar-chart/bar-chart';
import {
  PopupService,
  PopupOutletComponent,
  PopupRef,
  POPUP_REF,
  POPUP_DATA,
} from '../../ccms-popup';
import { DialogComponent, DialogButton } from '../../ccms-dialog';
import {
  ConfigureChartComponent,
  ConfigureChartData,
  ChartConfig,
  ChartType,
} from '../configure-chart/configure-chart';
import { Field } from '../../../models/filter-field.interface';
import { StackedBarChartData } from '../../charts/bar-chart-options';
import { CardComponent } from '../../card/card';
import { IconComponent } from '../../icon/icon';

/** Data passed to the confirm delete chart dialog */
interface ConfirmDeleteChartData {
  chartTitle: string;
}

/** Confirmation dialog for deleting a chart */
@Component({
  selector: 'ccms-confirm-delete-chart-dialog',
  template: `
    <ccms-dialog
      title="Delete Chart"
      [description]="description"
      [buttons]="buttons"
      [showCloseButton]="true"
      (escapePressed)="onCancel()"
    />
  `,
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConfirmDeleteChartDialogComponent {
  protected readonly popupRef = inject<PopupRef<boolean>>(POPUP_REF);
  protected readonly data = inject<ConfirmDeleteChartData>(POPUP_DATA);

  protected readonly description = this.data.chartTitle
    ? `Are you sure you want to delete '${this.data.chartTitle}'?`
    : 'Are you sure you want to delete this chart?';

  protected readonly buttons: DialogButton[] = [
    { label: 'Cancel', type: 'default', onClick: () => this.onCancel() },
    { label: 'Delete', type: 'danger-action', onClick: () => this.onConfirm() },
  ];

  protected onCancel(): void {
    this.popupRef.close(false);
  }

  protected onConfirm(): void {
    this.popupRef.close(true);
  }
}

export interface Chart {
  id: string;
  config: ChartConfig;
  data: { name: string; value: number }[];
  /** Stacked data for stacked bar charts (when stackBy is configured) */
  stackedData?: StackedBarChartData[];
  /** Optional color mapping for data values (e.g., { 'CURRENT': '#5CD69A' }) */
  colorMap?: Record<string, string>;
}

export interface ChartUpdateEvent {
  id: string;
  config: ChartConfig;
}

export interface AddChartEvent {
  config: ChartConfig;
  insertIndex?: number;
}

type GridItem =
  | { type: 'chart'; chart: Chart; index: number }
  | { type: 'gap'; insertIndex: number };

@Component({
  selector: 'ccms-custom-chart-list',
  templateUrl: './custom-chart-list.html',
  styleUrl: './custom-chart-list.css',
  imports: [
    DragDropModule,
    PieChartComponent,
    BarChartComponent,
    PopupOutletComponent,
    CardComponent,
    IconComponent,
  ],
  providers: [PopupService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomChartListComponent {
  charts = input.required<Chart[]>();
  fields = input.required<Field[]>();
  /** Whether charts can be added, removed, configured, or reordered. Default: true */
  editable = input<boolean>(true);

  addChart = output<AddChartEvent>();
  updateChart = output<ChartUpdateEvent>();
  removeChart = output<Chart>();
  reorder = output<Chart[]>();

  protected readonly ChartType = ChartType;
  private readonly popupService = inject(PopupService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Index of the chart card currently being hovered during drag */
  protected dropIndicatorIndex = signal<number | null>(null);
  /** Which side of the hovered chart to show the drop indicator */
  protected dropIndicatorSide = signal<'before' | 'after' | null>(null);
  /** Insert index of the gap currently being hovered during drag */
  protected dropTargetGapInsertIndex = signal<number | null>(null);

  /** Maximum number of charts allowed */
  protected static readonly MAX_CHARTS = 16;
  protected readonly maxCharts = CustomChartListComponent.MAX_CHARTS;

  /** Number of columns in the grid */
  private static readonly GRID_COLUMNS = 4;

  /** Cached chart card elements during drag operations */
  private dragChartCards: HTMLElement[] = [];
  /** Cached gap slot elements during drag operations */
  private dragGapSlots: HTMLElement[] = [];

  /** Whether the maximum number of charts has been reached */
  protected readonly isAtMaxCharts = computed(
    () => this.charts().length >= CustomChartListComponent.MAX_CHARTS,
  );

  /** Final column position after placing all charts (0 if row complete, 1-3 if partial) */
  private readonly finalColumnPosition = computed(() => {
    const charts = this.charts();
    if (charts.length === 0) return 0;

    let currentCol = 0;
    for (const chart of charts) {
      const width = Math.min(
        Math.max(chart.config.width || 1, 1),
        CustomChartListComponent.GRID_COLUMNS,
      );
      if (currentCol + width > CustomChartListComponent.GRID_COLUMNS) {
        currentCol = 0;
      }
      currentCol += width;
      if (currentCol >= CustomChartListComponent.GRID_COLUMNS) {
        currentCol = 0;
      }
    }
    return currentCol;
  });

  /** Grid items including charts and gap placeholders */
  protected readonly gridItems = computed<GridItem[]>(() => {
    const charts = this.charts();

    // Handle empty state - show 4 empty slots
    if (charts.length === 0) {
      return Array.from({ length: 4 }, () => ({ type: 'gap' as const, insertIndex: 0 }));
    }

    const items: GridItem[] = [];
    let currentCol = 0;

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      const width = Math.min(
        Math.max(chart.config.width || 1, 1),
        CustomChartListComponent.GRID_COLUMNS,
      );

      // Check if chart fits in current row
      if (currentCol + width > CustomChartListComponent.GRID_COLUMNS) {
        // Add gap placeholders to fill the rest of this row
        // Note: Multiple adjacent gaps share the same insertIndex since they
        // represent the same logical insertion point in the chart array
        const gapCount = CustomChartListComponent.GRID_COLUMNS - currentCol;
        for (let g = 0; g < gapCount; g++) {
          items.push({ type: 'gap', insertIndex: i });
        }
        currentCol = 0;
      }

      // Add the chart
      items.push({ type: 'chart', chart, index: i });
      currentCol += width;

      // Wrap to next row if full
      if (currentCol >= CustomChartListComponent.GRID_COLUMNS) {
        currentCol = 0;
      }
    }

    // Add trailing empty slots (when not at max and row is partially filled)
    const finalCol = this.finalColumnPosition();
    if (!this.isAtMaxCharts() && finalCol > 0) {
      const remaining = CustomChartListComponent.GRID_COLUMNS - finalCol;
      for (let g = 0; g < remaining; g++) {
        items.push({ type: 'gap', insertIndex: charts.length });
      }
    }

    return items;
  });

  /** Show full-width button when row is complete and not at max */
  protected readonly showFullWidthAdd = computed(() => {
    if (this.isAtMaxCharts()) return false;
    if (this.charts().length === 0) return false;
    return this.finalColumnPosition() === 0;
  });

  openConfigureChart(insertIndex?: number): void {
    if (this.isAtMaxCharts()) return;

    const popupRef = this.popupService.open<
      ConfigureChartComponent,
      ConfigureChartData,
      ChartConfig
    >(ConfigureChartComponent, { fields: this.fields() });
    popupRef.afterClosed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config: ChartConfig | undefined) => {
        if (config) {
          this.addChart.emit({ config, insertIndex });
        }
      });
  }

  onConfigureChart(chart: Chart): void {
    const popupRef = this.popupService.open<
      ConfigureChartComponent,
      ConfigureChartData,
      ChartConfig
    >(ConfigureChartComponent, { fields: this.fields(), config: chart.config });
    popupRef.afterClosed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config: ChartConfig | undefined) => {
        if (config) {
          this.updateChart.emit({ id: chart.id, config });
        }
      });
  }

  onDeleteChart(chart: Chart): void {
    this.popupService.open<ConfirmDeleteChartDialogComponent, ConfirmDeleteChartData, boolean>(
      ConfirmDeleteChartDialogComponent,
      { chartTitle: chart.config.title },
      (confirmed) => {
        if (confirmed) {
          this.removeChart.emit(chart);
        }
      },
    );
  }

  onDragHandleKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.moveChart(index, -1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.moveChart(index, 1);
    }
  }

  private moveChart(index: number, direction: -1 | 1): void {
    const charts = this.charts();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= charts.length) return;

    const reordered = [...charts];
    moveItemInArray(reordered, index, targetIndex);
    this.reorder.emit(reordered);
  }

  private cacheDragElements(): void {
    this.dragChartCards = Array.from(this.elementRef.nativeElement.querySelectorAll('.chart-card'));
    this.dragGapSlots = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.empty-slot:not(.empty-slot-full-width)'),
    );
  }

  private clearDragElementCache(): void {
    this.dragChartCards = [];
    this.dragGapSlots = [];
  }

  onDragMove(event: CdkDragMove<number>): void {
    // Cache DOM elements on first move event of a drag operation
    if (this.dragChartCards.length === 0) {
      this.cacheDragElements();
    }

    const draggedIndex = event.source.data;
    const pointerPosition = event.pointerPosition;

    // Check chart cards first
    for (let i = 0; i < this.dragChartCards.length; i++) {
      if (i === draggedIndex) continue;

      const rect = this.dragChartCards[i].getBoundingClientRect();
      if (
        pointerPosition.x >= rect.left &&
        pointerPosition.x <= rect.right &&
        pointerPosition.y >= rect.top &&
        pointerPosition.y <= rect.bottom
      ) {
        const midpoint = rect.left + rect.width / 2;
        this.dropIndicatorIndex.set(i);
        this.dropIndicatorSide.set(pointerPosition.x < midpoint ? 'before' : 'after');
        this.dropTargetGapInsertIndex.set(null);
        return;
      }
    }

    // Check gap slots (exclude full-width add button)
    for (let i = 0; i < this.dragGapSlots.length; i++) {
      const rect = this.dragGapSlots[i].getBoundingClientRect();
      if (
        pointerPosition.x >= rect.left &&
        pointerPosition.x <= rect.right &&
        pointerPosition.y >= rect.top &&
        pointerPosition.y <= rect.bottom
      ) {
        const insertIndex = parseInt(this.dragGapSlots[i].dataset['insertIndex'] ?? '', 10);
        if (isNaN(insertIndex)) continue; // Skip invalid gaps
        this.dropTargetGapInsertIndex.set(insertIndex);
        this.dropIndicatorIndex.set(null);
        this.dropIndicatorSide.set(null);
        return;
      }
    }

    // Clear all indicators
    this.dropIndicatorIndex.set(null);
    this.dropIndicatorSide.set(null);
    this.dropTargetGapInsertIndex.set(null);
  }

  onDragEnded(): void {
    this.dropIndicatorIndex.set(null);
    this.dropIndicatorSide.set(null);
    this.dropTargetGapInsertIndex.set(null);
    this.clearDragElementCache();
  }

  onDrop(event: CdkDragDrop<Chart[]>): void {
    // Ensure cache is populated (may not have had move events)
    if (this.dragChartCards.length === 0) {
      this.cacheDragElements();
    }

    const draggedIndex = event.item.data as number;
    const dropPoint = event.dropPoint;

    // Clear visual indicators
    this.dropIndicatorIndex.set(null);
    this.dropIndicatorSide.set(null);
    this.dropTargetGapInsertIndex.set(null);

    // Check if dropped on a gap slot first
    for (let i = 0; i < this.dragGapSlots.length; i++) {
      const rect = this.dragGapSlots[i].getBoundingClientRect();
      if (
        dropPoint.x >= rect.left &&
        dropPoint.x <= rect.right &&
        dropPoint.y >= rect.top &&
        dropPoint.y <= rect.bottom
      ) {
        let insertIndex = parseInt(this.dragGapSlots[i].dataset['insertIndex'] ?? '', 10);
        if (isNaN(insertIndex)) continue; // Skip invalid gaps

        // Adjust for removal of dragged item
        if (draggedIndex < insertIndex) {
          insertIndex--;
        }

        if (insertIndex !== draggedIndex) {
          const reordered = [...this.charts()];
          moveItemInArray(reordered, draggedIndex, insertIndex);
          this.reorder.emit(reordered);
        }
        this.clearDragElementCache();
        return;
      }
    }

    // Find which chart card we dropped onto and determine side
    let targetIndex = -1;
    let side: 'before' | 'after' | null = null;

    for (let i = 0; i < this.dragChartCards.length; i++) {
      if (i === draggedIndex) continue;

      const rect = this.dragChartCards[i].getBoundingClientRect();
      if (
        dropPoint.x >= rect.left &&
        dropPoint.x <= rect.right &&
        dropPoint.y >= rect.top &&
        dropPoint.y <= rect.bottom
      ) {
        targetIndex = i;
        const midpoint = rect.left + rect.width / 2;
        side = dropPoint.x < midpoint ? 'before' : 'after';
        break;
      }
    }

    this.clearDragElementCache();

    if (targetIndex === -1 || side === null) return;

    let insertIndex = side === 'after' ? targetIndex + 1 : targetIndex;

    // Adjust for removal of dragged item
    if (draggedIndex < insertIndex) {
      insertIndex--;
    }

    if (insertIndex === draggedIndex) return;

    const reordered = [...this.charts()];
    moveItemInArray(reordered, draggedIndex, insertIndex);
    this.reorder.emit(reordered);
  }
}
