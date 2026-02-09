import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Search Progress Component
 *
 * Displays search progress with progress bar and stop button
 */
@Component({
  selector: 'ccms-search-progress',
  templateUrl: './search-progress.component.html',
  styleUrl: './search-progress.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchProgressComponent {
  // ========== Inputs ==========

  /** Number of resources processed */
  resourcesProcessed = input.required<number>();

  /** Total number of resources to process */
  totalResources = input.required<number>();

  /** Total matches found so far */
  matchesFound = input.required<number>();

  // ========== Outputs ==========

  /** Emits when stop button is clicked */
  stopSearch = output<void>();

  // ========== Computed ==========

  /** Progress percentage */
  protected progressPercent = computed(() => {
    const total = this.totalResources();
    const processed = this.resourcesProcessed();
    return total > 0 ? Math.round((processed / total) * 100) : 0;
  });

  // ========== Methods ==========

  protected onStopClick(): void {
    this.stopSearch.emit();
  }
}
