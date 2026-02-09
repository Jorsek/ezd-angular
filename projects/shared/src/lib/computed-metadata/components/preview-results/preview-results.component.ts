import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PreviewItem, RecomputeProgress } from '../../models';

/**
 * Displays preview results from an SSE stream.
 * Shows a table of filenames with their computed values and matched XPaths.
 */
@Component({
  selector: 'ccms-preview-results',
  templateUrl: './preview-results.component.html',
  styleUrl: './preview-results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsComponent {
  /** Preview items to display */
  items = input.required<PreviewItem[]>();

  /** Whether preview is currently loading */
  isLoading = input(false);

  /** Recompute progress (when recomputing) */
  recomputeProgress = input<RecomputeProgress | null>(null);

  /** Error message if any */
  error = input<string | null>(null);

  /** Emitted when user wants to close the preview */
  closePanel = output<void>();

  // Computed stats
  protected totalItems = computed(() => this.items().length);

  protected matchedCount = computed(
    () => this.items().filter((item) => item.matchedXpath !== null).length,
  );

  protected defaultCount = computed(
    () => this.items().filter((item) => item.matchedXpath === null && item.value !== null).length,
  );

  protected topicCount = computed(
    () => this.items().filter((item) => item.ditaType === 'TOPIC').length,
  );

  protected mapCount = computed(
    () => this.items().filter((item) => item.ditaType === 'MAP').length,
  );

  protected progressPercent = computed(() => {
    const progress = this.recomputeProgress();
    if (!progress || !progress.total || progress.total === 0) return 0;
    const current = progress.current ?? 0;
    return Math.round((current / progress.total) * 100);
  });

  protected onClose(): void {
    this.closePanel.emit();
  }
}
