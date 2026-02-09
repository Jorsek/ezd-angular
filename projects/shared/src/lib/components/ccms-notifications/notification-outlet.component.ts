import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { NotificationService } from './notification.service';
import { NotificationState } from './notification.models';

@Component({
  selector: 'ccms-notification-outlet',
  templateUrl: './notification-outlet.component.html',
  styleUrl: './notification.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationOutletComponent {
  protected notificationService = inject(NotificationService);

  protected onRetry(notification: NotificationState): void {
    const config = notification.config;
    if (config.type === 'error' && config.retry) {
      config.retry();
      notification.ref.dismiss();
    }
  }
}
