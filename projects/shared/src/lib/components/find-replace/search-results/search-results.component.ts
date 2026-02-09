import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FileMatches } from '../../../services/find-replace/models';
import { FileMatchGroupComponent } from '../file-match-group/file-match-group.component';

/**
 * Search Results Component
 *
 * Displays search results with file grouping, expand/collapse controls, and statistics
 */
@Component({
  selector: 'ccms-search-results',
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileMatchGroupComponent],
})
export class SearchResultsComponent {
  // ========== Inputs ==========

  /** List of file matches */
  fileMatches = input.required<FileMatches[]>();

  /** Set of expanded file UUIDs */
  expandedFiles = input.required<Set<string>>();

  /** Total matches count */
  totalMatches = input.required<number>();

  /** Number of resources with matches */
  resourcesWithMatches = input.required<number>();

  /** Total resources searched */
  totalResources = input.required<number>();

  /** Search duration in milliseconds */
  durationMs = input.required<number>();

  // ========== Outputs ==========

  /** Emits when a file's expansion is toggled */
  toggleFileExpansion = output<string>();

  /** Emits when expand all is clicked */
  expandAll = output<void>();

  /** Emits when collapse all is clicked */
  collapseAll = output<void>();

  // ========== Methods ==========

  protected onToggleFileExpansion(uuid: string): void {
    this.toggleFileExpansion.emit(uuid);
  }

  protected onExpandAll(): void {
    this.expandAll.emit();
  }

  protected onCollapseAll(): void {
    this.collapseAll.emit();
  }

  protected isFileExpanded(uuid: string): boolean {
    return this.expandedFiles().has(uuid);
  }

  protected formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      const seconds = ms / 1000;
      return `${seconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }
}
