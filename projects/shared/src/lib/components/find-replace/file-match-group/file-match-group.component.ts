import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FileMatches } from '../../../services/find-replace/models';

/**
 * File Match Group Component
 *
 * Displays a single file's matches with expand/collapse functionality
 */
@Component({
  selector: 'ccms-file-match-group',
  templateUrl: './file-match-group.component.html',
  styleUrl: './file-match-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileMatchGroupComponent {
  // ========== Inputs ==========

  /** File matches data */
  fileMatch = input.required<FileMatches>();

  /** Whether this group is expanded */
  expanded = input<boolean>(false);

  // ========== Outputs ==========

  /** Emits when expand/collapse is toggled */
  toggleExpand = output<void>();

  // ========== Methods ==========

  protected onHeaderClick(): void {
    this.toggleExpand.emit();
  }
}
