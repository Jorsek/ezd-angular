import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

/** Job object structure */
export interface JobInfo {
  id: number;
  [key: string]: unknown;
}

/** Callback type for job click events */
export type JobClickCallback = (jobId: number) => void;

/**
 * Renders a list of job links as clickable buttons.
 * Supports both output event (jobClick) and callback input (onJobClick) patterns.
 *
 * @example
 * Using with output (standard Angular pattern):
 * ```html
 * <ccms-jobs-cell
 *   [jobs]="row['includedInJobs']"
 *   (jobClick)="openJobPopup($event)"
 * />
 * ```
 *
 * @example
 * Using with callback (for ngComponentOutlet):
 * ```typescript
 * cellComponent: {
 *   type: JobsCellComponent,
 *   inputs: (row) => ({
 *     jobs: row['includedInJobs'],
 *     onJobClick: (jobId) => this.openJobPopup(jobId),
 *   }),
 * }
 * ```
 */
@Component({
  selector: 'ccms-jobs-cell',
  template: `
    @for (job of jobs(); track job.id; let last = $last) {
      <button class="job-link" (click)="handleJobClick(job.id)" type="button">
        {{ job.id }}
      </button>
      @if (!last) {
        <span>, </span>
      }
    }
  `,
  styles: `
    .job-link {
      background: none;
      border: none;
      color: #1a73e8;
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      padding: 0;
      text-decoration: none;
    }

    .job-link:hover {
      text-decoration: underline;
      background: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class JobsCellComponent {
  /** Array of jobs to display */
  jobs = input<JobInfo[]>([]);

  /** Callback for job click (use with ngComponentOutlet) */
  onJobClick = input<JobClickCallback>();

  /** Output event for job click (standard Angular pattern) */
  jobClick = output<number>();

  protected handleJobClick(jobId: number): void {
    // Call callback if provided (for ngComponentOutlet usage)
    const callback = this.onJobClick();
    if (callback) {
      callback(jobId);
    }
    // Always emit output for standard usage
    this.jobClick.emit(jobId);
  }
}
