import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  DragRef,
  moveItemInArray,
  Point,
} from '@angular/cdk/drag-drop';
import { ComputedMetadataDefinition, RecomputeProgress, DATA_TYPE_LABELS } from '../../models';

/**
 * Displays a list of extracted metadata definitions.
 * Emits events when user wants to edit, delete, preview, or recompute a definition.
 */
@Component({
  selector: 'ccms-definition-list',
  templateUrl: './definition-list.component.html',
  styleUrl: './definition-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule],
})
export class DefinitionListComponent {
  /** Data type labels for display */
  protected readonly dataTypeLabels = DATA_TYPE_LABELS;

  /** Reference to the table element for width matching */
  private tableRef = viewChild<ElementRef<HTMLTableElement>>('definitionsTable');

  /** Get the current table width for drag preview */
  protected get tableWidth(): number {
    return this.tableRef()?.nativeElement?.offsetWidth ?? 800;
  }

  /** Get column widths from the table header for drag preview */
  protected get columnWidths(): number[] {
    const table = this.tableRef()?.nativeElement;
    if (!table) return [56, 300, 100, 110, 140, 180];
    const headerCells = table.querySelectorAll('thead th');
    return Array.from(headerCells).map((th) => (th as HTMLElement).offsetWidth);
  }

  /** List of definitions to display */
  definitions = input.required<ComputedMetadataDefinition[]>();

  /** ID of definition currently being recomputed (null if none) */
  recomputingId = input<number | null>(null);

  /** Progress of current recompute operation */
  recomputeProgress = input<RecomputeProgress | null>(null);

  /** Computed progress percentage */
  protected progressPercent = computed(() => {
    const progress = this.recomputeProgress();
    if (!progress || !progress.total || progress.total === 0) return 0;
    const current = progress.current ?? 0;
    return Math.round((current / progress.total) * 100);
  });

  /** Emitted when user clicks to edit a definition */
  edit = output<ComputedMetadataDefinition>();

  /** Emitted when user clicks to delete a definition */
  deleteItem = output<ComputedMetadataDefinition>();

  /** Emitted when user clicks to recompute a definition */
  recompute = output<ComputedMetadataDefinition>();

  /** Emitted when user reorders definitions via drag and drop */
  reorder = output<ComputedMetadataDefinition[]>();

  protected onDrop(event: CdkDragDrop<ComputedMetadataDefinition[]>): void {
    const reordered = [...this.definitions()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.reorder.emit(reordered);
  }

  protected onEdit(event: Event, definition: ComputedMetadataDefinition): void {
    event.stopPropagation();
    this.edit.emit(definition);
  }

  protected onDelete(event: Event, definition: ComputedMetadataDefinition): void {
    this.deleteItem.emit(definition);
  }

  protected onRecompute(event: Event, definition: ComputedMetadataDefinition): void {
    this.recompute.emit(definition);
  }

  protected constrainPosition = (
    point: Point,
    _dragRef: DragRef,
    _dimensions: DOMRect,
    pickupPositionInElement: Point,
  ): Point => {
    return {
      x: point.x - pickupPositionInElement.x,
      y: point.y - pickupPositionInElement.y,
    };
  };
}
