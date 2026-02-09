import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

export interface DialogButton {
  label: string;
  /** Button types: default (outline), action (dark filled), danger (red outline, left side), danger-action (red filled, right side) */
  type: 'default' | 'action' | 'danger' | 'danger-action';
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Dialog Component
 *
 * A reusable dialog layout component with title, description, content, and action buttons.
 * Supports keyboard navigation: Enter executes the action button, Escape triggers cancel.
 */
@Component({
  selector: 'ccms-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(keydown.enter)': 'onEnterKey($event)',
    '(keydown.escape)': 'onEscapeKey()',
  },
})
export class DialogComponent {
  title = input.required<string>();
  description = input<string>();
  buttons = input<DialogButton[]>([]);
  showCloseButton = input<boolean>(false);

  /** Emitted when Escape key or close button is pressed */
  escapePressed = output<void>();

  protected actionButton = computed(() =>
    this.buttons().find((b) => b.type === 'action' && !b.disabled),
  );

  /** Danger buttons go on the left side */
  protected leftButtons = computed(() => this.buttons().filter((b) => b.type === 'danger'));

  /** Default and action buttons go on the right side */
  protected rightButtons = computed(() => this.buttons().filter((b) => b.type !== 'danger'));

  protected onEnterKey(event: Event): void {
    const action = this.actionButton();
    if (action) {
      event.preventDefault();
      action.onClick();
    }
  }

  protected onEscapeKey(): void {
    this.escapePressed.emit();
  }

  protected onCloseClick(): void {
    this.escapePressed.emit();
  }
}
