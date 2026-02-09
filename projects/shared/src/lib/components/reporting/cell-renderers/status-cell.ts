import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  computed,
} from '@angular/core';

/** Status type determines the color scheme and label mappings */
export type StatusType = 'fileStatus' | 'l10nStatus';

/** Status configuration for rendering */
interface StatusConfig {
  label: string;
  cssClass: string;
}

/** File status mappings */
const FILE_STATUS_MAP: Record<string, StatusConfig> = {
  ON_HOLD: { label: 'On Hold', cssClass: 'on-hold' },
  IN_PROGRESS: { label: 'In Progress', cssClass: 'in-progress' },
  IN_REVIEW: { label: 'In Review', cssClass: 'in-review' },
  APPROVED: { label: 'Approved', cssClass: 'approved' },
  NEEDS_REEVALUATION: { label: 'Needs Reevaluation', cssClass: 'needs-reevaluation' },
  OBSOLETED: { label: 'Obsoleted', cssClass: 'obsoleted' },
  AUTHORING: { label: 'Authoring', cssClass: 'authoring' },
  DRAFT: { label: 'Draft', cssClass: 'draft' },
  PUBLISHED: { label: 'Published', cssClass: 'published' },
};

/** Localization status mappings */
const L10N_STATUS_MAP: Record<string, StatusConfig> = {
  CURRENT: { label: 'Current', cssClass: 'current' },
  MISSING: { label: 'Missing', cssClass: 'missing' },
  OUTDATED: { label: 'Out-of-date', cssClass: 'outdated' },
};

/**
 * Renders a status badge with appropriate styling.
 * Supports file status and localization status types.
 *
 * @example
 * ```html
 * <ccms-status-cell [value]="row['fileStatus']" type="fileStatus" />
 * <ccms-status-cell [value]="row['localizedResourceStatus']" type="l10nStatus" />
 * ```
 */
@Component({
  selector: 'ccms-status-cell',
  template: `
    @if (config(); as cfg) {
      <span class="status" [class]="cfg.cssClass">{{ cfg.label }}</span>
    } @else {
      <span>{{ value() ?? '-' }}</span>
    }
  `,
  styleUrl: './status-badges.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StatusCellComponent {
  /** The status value to display */
  value = input<string | null | undefined>();

  /** The type of status (determines color scheme) */
  type = input<StatusType>('fileStatus');

  /** Computed status configuration based on value and type */
  protected config = computed<StatusConfig | null>(() => {
    const val = this.value()?.toUpperCase();
    if (!val) return null;

    const statusMap = this.type() === 'l10nStatus' ? L10N_STATUS_MAP : FILE_STATUS_MAP;
    return statusMap[val] ?? null;
  });
}
