import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ComputedMetadataService } from '../../services';
import {
  ComputedMetadataDefinition,
  CreateDefinitionRequest,
  isXpathValidationError,
  RecomputeProgress,
} from '../../models';
import { DefinitionListComponent } from '../definition-list/definition-list.component';
import { DefinitionFormDialogComponent } from '../definition-form-dialog/definition-form-dialog.component';

/**
 * Main container component for extracted metadata management.
 * Coordinates sub-components and manages application state.
 */
@Component({
  selector: 'ccms-computed-metadata',
  templateUrl: './computed-metadata.component.html',
  styleUrl: './computed-metadata.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DefinitionListComponent, DefinitionFormDialogComponent],
})
export class ComputedMetadataComponent implements OnDestroy {
  private readonly MAX_DEFINITIONS = 50;

  private service = inject(ComputedMetadataService);
  private recomputeSubscription: Subscription | null = null;
  private recomputeCleanupTimer: ReturnType<typeof setTimeout> | null = null;

  protected formDialogRef = viewChild(DefinitionFormDialogComponent);

  // View state
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  // Dialog state
  protected showFormDialog = signal(false);
  protected editingDefinition = signal<ComputedMetadataDefinition | null>(null);

  // Data state
  protected definitions = signal<ComputedMetadataDefinition[]>([]);
  protected canCreateNew = computed(() => this.definitions().length < this.MAX_DEFINITIONS);

  // Form state
  protected isSaving = signal(false);

  // Recompute state (inline in list)
  protected recomputingId = signal<number | null>(null);
  protected recomputeProgress = signal<RecomputeProgress | null>(null);

  constructor() {
    this.loadDefinitions();
  }

  // ==================== Data Loading ====================

  private loadDefinitions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.listDefinitions().subscribe({
      next: (definitions) => {
        this.definitions.set(definitions);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load definitions: ' + err.message);
        this.isLoading.set(false);
      },
    });
  }

  // ==================== List Actions ====================

  protected onCreateNew(): void {
    this.editingDefinition.set(null);
    this.showFormDialog.set(true);
  }

  protected onEdit(definition: ComputedMetadataDefinition): void {
    this.editingDefinition.set(definition);
    this.showFormDialog.set(true);
  }

  protected onDialogClose(): void {
    this.showFormDialog.set(false);
    this.editingDefinition.set(null);
  }

  protected onDelete(definition: ComputedMetadataDefinition): void {
    if (!confirm(`Delete definition "${definition.name}"? This cannot be undone.`)) {
      return;
    }

    this.isLoading.set(true);
    this.service.deleteDefinition(definition.id).subscribe({
      next: () => {
        this.definitions.update((defs) => defs.filter((d) => d.id !== definition.id));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to delete: ' + err.message);
        this.isLoading.set(false);
      },
    });
  }

  protected onRecompute(definition: ComputedMetadataDefinition): void {
    this.recomputingId.set(definition.id);
    this.recomputeProgress.set(null);
    this.error.set(null);
    this.startRecompute(definition.id);
  }

  protected onReorder(reorderedDefinitions: ComputedMetadataDefinition[]): void {
    // Optimistically update the UI
    this.definitions.set(reorderedDefinitions);

    // Persist to backend
    const ids = reorderedDefinitions.map((d) => d.id);
    this.service.reorderDefinitions(ids).subscribe({
      next: (updated) => {
        this.definitions.set(updated);
      },
      error: (err) => {
        this.error.set('Failed to reorder: ' + err.message);
        // Reload to restore correct order
        this.loadDefinitions();
      },
    });
  }

  // ==================== Form Actions ====================

  protected onDialogSave(request: CreateDefinitionRequest): void {
    this.isSaving.set(true);
    this.error.set(null);

    const editing = this.editingDefinition();

    if (editing) {
      this.service.updateDefinition(editing.id, request).subscribe({
        next: (updated) => {
          this.definitions.update((defs) => defs.map((d) => (d.id === updated.id ? updated : d)));
          this.isSaving.set(false);
          this.showFormDialog.set(false);
          this.editingDefinition.set(null);
        },
        error: (err) => {
          this.handleSaveError(err, 'Failed to update');
        },
      });
    } else {
      this.service.createDefinition(request).subscribe({
        next: (created) => {
          this.definitions.update((defs) => [...defs, created]);
          this.isSaving.set(false);
          this.showFormDialog.set(false);
          this.editingDefinition.set(null);
        },
        error: (err) => {
          this.handleSaveError(err, 'Failed to create');
        },
      });
    }
  }

  private handleSaveError(err: unknown, prefix: string): void {
    this.isSaving.set(false);
    if (isXpathValidationError(err)) {
      const dialogRef = this.formDialogRef();
      if (dialogRef) {
        dialogRef.setXpathError(err.error.xpath, err.error.detail);
        return;
      }
    }
    const httpError = err as { error?: { detail?: string }; message?: string };
    const message = httpError.error?.detail || httpError.message || 'Unknown error';
    this.error.set(`${prefix}: ${message}`);
  }

  // ==================== Recompute ====================

  private startRecompute(definitionId: number): void {
    if (this.recomputeSubscription) {
      this.recomputeSubscription.unsubscribe();
      this.recomputeSubscription = null;
    }

    this.recomputeSubscription = this.service.recompute(definitionId).subscribe({
      next: (progress) => {
        this.recomputeProgress.set(progress);
      },
      error: (err) => {
        this.error.set('Recompute failed: ' + err.message);
        this.recomputingId.set(null);
        this.recomputeProgress.set(null);
      },
      complete: () => {
        this.recomputeCleanupTimer = setTimeout(() => {
          this.recomputingId.set(null);
          this.recomputeProgress.set(null);
          this.recomputeCleanupTimer = null;
        }, 2000);
      },
    });
  }

  private cancelRecompute(): void {
    if (this.recomputeSubscription) {
      this.recomputeSubscription.unsubscribe();
      this.recomputeSubscription = null;
    }
    this.recomputingId.set(null);
    this.recomputeProgress.set(null);
  }

  // ==================== Lifecycle ====================

  ngOnDestroy(): void {
    this.cancelRecompute();
    if (this.recomputeCleanupTimer) {
      clearTimeout(this.recomputeCleanupTimer);
      this.recomputeCleanupTimer = null;
    }
  }
}
