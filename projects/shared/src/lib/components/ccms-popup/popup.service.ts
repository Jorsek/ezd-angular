import { Injectable, Injector, Type, DestroyRef, inject, signal } from '@angular/core';
import { take } from 'rxjs';
import { PopupRef } from './popup-ref';
import { POPUP_REF, POPUP_DATA } from './popup.tokens';

export interface PopupState {
  component: Type<unknown>;
  injector: Injector;
}

// Service is intentionally not providedIn: 'root' - it's meant to be provided
// at component level for hierarchical scoping (each parent gets its own instance)
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class PopupService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private currentPopupRef: PopupRef<unknown> | null = null;
  private readonly state = signal<PopupState | null>(null);

  readonly popup = this.state.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.destroy());
  }

  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    data?: D,
    onClose?: (result: R | undefined) => void,
  ): PopupRef<R> {
    this.closeCurrent();

    const popupRef = new PopupRef<R>();

    const injector = Injector.create({
      providers: [
        { provide: POPUP_REF, useValue: popupRef },
        { provide: POPUP_DATA, useValue: data },
      ],
      parent: this.injector,
    });

    popupRef._destroy = () => this.closeCurrent();
    this.currentPopupRef = popupRef as PopupRef<unknown>;
    this.state.set({ component, injector });

    if (onClose) {
      popupRef.afterClosed$.pipe(take(1)).subscribe(onClose);
    }

    return popupRef;
  }

  private closeCurrent(): void {
    if (this.currentPopupRef) {
      this.currentPopupRef._complete();
      this.currentPopupRef = null;
    }
    this.state.set(null);
  }

  private destroy(): void {
    this.closeCurrent();
  }
}
