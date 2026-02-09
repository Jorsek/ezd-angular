import { Injectable, signal } from '@angular/core';
import { NotificationRef } from './notification-ref';
import { NotificationConfig, NotificationState } from './notification.models';

const SUCCESS_DISMISS_DELAY = 5000;

// Service is intentionally not providedIn: 'root' - it's meant to be provided
// at component level for hierarchical scoping (each parent gets its own instance)
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class NotificationService {
  private readonly notifications = signal<NotificationState[]>([]);
  private nextId = 0;

  /** Observable queue of active notifications */
  readonly queue = this.notifications.asReadonly();

  /**
   * Show a success notification.
   * Auto-dismisses after 5 seconds.
   */
  success(message: string): NotificationRef {
    return this.add({ type: 'success', message });
  }

  /**
   * Show an error notification.
   * Does NOT auto-dismiss - user must click Dismiss or Retry.
   *
   * @param text - Error message to display
   * @param retry - Optional callback invoked when Retry button is clicked
   */
  error(text: string, retry?: () => void): NotificationRef {
    return this.add({ type: 'error', text, retry });
  }

  private add(config: NotificationConfig): NotificationRef {
    const id = this.nextId++;
    const ref = new NotificationRef();

    ref._destroy = () => this.remove(id);

    const state: NotificationState = { id, config, ref };

    // Add new notification at the beginning (top of stack)
    this.notifications.update((current) => [state, ...current]);

    // Auto-dismiss success notifications after delay
    if (config.type === 'success') {
      setTimeout(() => ref.dismiss(), SUCCESS_DISMISS_DELAY);
    }

    return ref;
  }

  private remove(id: number): void {
    this.notifications.update((current) => current.filter((n) => n.id !== id));
  }
}
