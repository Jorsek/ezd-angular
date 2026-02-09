import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

/**
 * Example button component demonstrating Angular best practices
 *
 * Features:
 * - Standalone component (default in Angular 20+, no standalone: true needed)
 * - OnPush change detection for performance
 * - Signal-based state management
 * - input() and output() functions (not decorators)
 * - computed() for derived state
 * - Host bindings in decorator (not @HostBinding)
 * - Fully accessible with ARIA attributes
 * - Scoped styles with ViewEncapsulation
 */
@Component({
  selector: 'ccms-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.button--primary]': 'variant() === "primary"',
    '[class.button--secondary]': 'variant() === "secondary"',
    '[class.button--disabled]': 'disabled()',
    '[attr.role]': '"button"',
  },
})
export class ButtonComponent {
  // Inputs using input() function
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input<boolean>(false);
  label = input<string>('');
  ariaLabel = input<string>('');

  // Outputs using output() function
  buttonClick = output<MouseEvent>();

  // Signal-based local state
  protected clickCount = signal<number>(0);

  // Computed derived state
  protected isInteractive = computed(() => !this.disabled());
  protected effectiveAriaLabel = computed(() => this.ariaLabel() || this.label());

  protected handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Update local state using set
    this.clickCount.set(this.clickCount() + 1);

    // Emit event to parent
    this.buttonClick.emit(event);
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    // Accessibility: Handle Enter and Space keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick(event as unknown as MouseEvent);
    }
  }
}
