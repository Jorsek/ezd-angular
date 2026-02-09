import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

/** Alert types with corresponding visual styles */
export type AlertType = 'warning' | 'error' | 'info' | 'success';

/**
 * Reusable alert banner component for displaying messages to users.
 *
 * @example Warning with retry
 * ```html
 * <ccms-alert-banner
 *   type="warning"
 *   message="Failed to load data."
 *   hint="Click retry to try again."
 *   [showRetry]="true"
 *   (retry)="onRetry()">
 * </ccms-alert-banner>
 * ```
 *
 * @example Info message
 * ```html
 * <ccms-alert-banner
 *   type="info"
 *   message="Data is being refreshed in the background.">
 * </ccms-alert-banner>
 * ```
 */
@Component({
  selector: 'ccms-alert-banner',
  templateUrl: './alert-banner.html',
  styleUrl: './alert-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    role: 'alert',
  },
})
export class AlertBannerComponent {
  /** The type of alert - determines color scheme */
  type = input<AlertType>('warning');

  /** Main message to display */
  message = input.required<string>();

  /** Optional hint/secondary message */
  hint = input<string>('');

  /** Optional list of detail messages */
  messages = input<string[]>([]);

  /** Whether to show a retry button */
  showRetry = input<boolean>(false);

  /** Text for the retry button */
  retryText = input<string>('Retry');

  /** Emitted when retry button is clicked */
  retry = output<void>();

  protected hostClasses = computed(() => `ccms-alert-banner ccms-alert-banner--${this.type()}`);

  protected icon = computed(() => {
    switch (this.type()) {
      case 'error':
        return '✕';
      case 'success':
        return '✓';
      case 'info':
        return 'ℹ';
      case 'warning':
      default:
        return '⚠';
    }
  });

  protected onRetryClick(): void {
    this.retry.emit();
  }
}
