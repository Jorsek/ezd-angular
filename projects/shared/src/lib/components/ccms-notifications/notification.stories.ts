import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { NotificationOutletComponent } from './notification-outlet.component';
import { NotificationService } from './notification.service';

/**
 * Wrapper component that provides buttons to trigger notifications
 */
@Component({
  selector: 'ccms-notification-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <button (click)="showSuccess()">Show Success</button>
      <button (click)="showError()">Show Error</button>
      <button (click)="showErrorWithRetry()">Show Error with Retry</button>
      <button (click)="showMultiple()">Show Multiple</button>
    </div>
    <p style="color: #666; font-size: 14px;">Notifications appear in the bottom-right corner.</p>
    <ccms-notification-outlet />
  `,
  imports: [NotificationOutletComponent],
  providers: [NotificationService],
})
class NotificationDemoComponent {
  private notificationService = inject(NotificationService);

  showSuccess(): void {
    this.notificationService.success('Operation completed successfully');
  }

  showError(): void {
    this.notificationService.error('An error occurred while saving');
  }

  showErrorWithRetry(): void {
    this.notificationService.error('Failed to save view "My View"', () => {
      this.notificationService.success('Retry successful!');
    });
  }

  showMultiple(): void {
    this.notificationService.success('First notification');
    setTimeout(() => this.notificationService.success('Second notification'), 200);
    setTimeout(() => this.notificationService.error('Third notification (error)'), 400);
  }
}

const meta: Meta<NotificationDemoComponent> = {
  title: 'Components/Notifications',
  component: NotificationDemoComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
A toast-style notification system for displaying success and error messages.

## Features

- **Success Notifications**: Auto-dismiss after 5 seconds
- **Error Notifications**: Persist until manually dismissed
- **Retry Support**: Error notifications can include a retry callback
- **Stacking**: Multiple notifications stack in the bottom-right corner

## Usage

\`\`\`typescript
// In your component
@Component({
  providers: [NotificationService],
  template: \`
    <!-- Your content -->
    <ccms-notification-outlet />
  \`
})
export class MyComponent {
  private notificationService = inject(NotificationService);

  saveData(): void {
    this.api.save(data).subscribe({
      next: () => this.notificationService.success('Data saved'),
      error: () => this.notificationService.error(
        'Failed to save data',
        () => this.saveData() // Retry callback
      ),
    });
  }
}
\`\`\`

## API

**NotificationService**
- \`success(message: string)\`: Show a success notification (auto-dismisses)
- \`error(text: string, retry?: () => void)\`: Show an error notification

**NotificationOutletComponent**
- Place once in your component template to render notifications
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<NotificationDemoComponent>;

/**
 * Interactive demo with buttons to trigger different notification types.
 */
export const Interactive: Story = {};

/**
 * Success notification - auto-dismisses after 5 seconds.
 */
export const SuccessNotification: Story = {
  render: () => ({
    template: `
      <ccms-notification-demo />
      <p style="margin-top: 16px; color: #666;">Click "Show Success" to see a success notification.</p>
    `,
  }),
};

/**
 * Error notification without retry - must be manually dismissed.
 */
export const ErrorNotification: Story = {
  render: () => ({
    template: `
      <ccms-notification-demo />
      <p style="margin-top: 16px; color: #666;">Click "Show Error" to see an error notification.</p>
    `,
  }),
};

/**
 * Error notification with retry callback - clicking Retry invokes the callback and dismisses.
 */
export const ErrorWithRetry: Story = {
  render: () => ({
    template: `
      <ccms-notification-demo />
      <p style="margin-top: 16px; color: #666;">Click "Show Error with Retry" to see an error with a Retry button.</p>
    `,
  }),
};

/**
 * Multiple stacked notifications.
 */
export const MultipleNotifications: Story = {
  render: () => ({
    template: `
      <ccms-notification-demo />
      <p style="margin-top: 16px; color: #666;">Click "Show Multiple" to see stacked notifications.</p>
    `,
  }),
};
