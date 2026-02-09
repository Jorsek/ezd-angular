import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  effect,
  inject,
  viewChild,
  ViewContainerRef,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { PopupService } from './popup.service';

@Component({
  selector: 'ccms-popup-outlet',
  template: `
    @if (isVisible()) {
      <div class="ccms-popup-backdrop" [class.ccms-popup-visible]="isAnimatingIn()">
        <div class="ccms-popup-content">
          <ng-container #outlet />
        </div>
      </div>
    }
  `,
  styleUrl: './popup.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopupOutletComponent {
  protected readonly popupService = inject(PopupService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly outlet = viewChild('outlet', { read: ViewContainerRef });

  protected readonly isVisible = signal(false);
  protected readonly isAnimatingIn = signal(false);

  constructor() {
    effect(() => {
      const state = this.popupService.popup();
      const outletRef = this.outlet();

      if (state && outletRef) {
        outletRef.clear();
        outletRef.createComponent(state.component, {
          injector: state.injector,
        });
        // Trigger animation after component is rendered
        requestAnimationFrame(() => {
          this.isAnimatingIn.set(true);
          this.cdr.markForCheck();
        });
      }
    });

    // Separate effect to handle visibility
    effect(() => {
      const state = this.popupService.popup();
      if (state) {
        this.isVisible.set(true);
        this.isAnimatingIn.set(false);
      } else {
        this.isAnimatingIn.set(false);
        this.isVisible.set(false);
      }
    });
  }
}
