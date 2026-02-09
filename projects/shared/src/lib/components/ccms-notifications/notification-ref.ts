import { Subject } from 'rxjs';

/**
 * Handle for a notification instance.
 * Allows dismissing the notification and subscribing to its closure.
 */
export class NotificationRef {
  private readonly dismissedSubject = new Subject<void>();
  readonly dismissed$ = this.dismissedSubject.asObservable();
  private closed = false;

  /** @internal */
  _destroy: () => void = () => {};

  /**
   * Dismiss this notification.
   * Safe to call multiple times (idempotent).
   */
  dismiss(): void {
    if (this.closed) return;
    this.closed = true;
    this._destroy();
    this.dismissedSubject.next();
    this.dismissedSubject.complete();
  }
}
