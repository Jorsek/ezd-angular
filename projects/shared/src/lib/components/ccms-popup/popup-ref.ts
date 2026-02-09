import { Subject } from 'rxjs';

export class PopupRef<R = unknown> {
  private readonly afterClosedSubject = new Subject<R | undefined>();
  private closed = false;

  readonly afterClosed$ = this.afterClosedSubject.asObservable();

  /** @internal Called by service to wire up destruction */
  _destroy: () => void = () => {};

  close(result?: R): void {
    if (this.closed) return;
    this.closed = true;
    this._destroy();
    this.afterClosedSubject.next(result);
    this.afterClosedSubject.complete();
  }

  /** @internal Called when parent destroys without explicit close */
  _complete(): void {
    if (this.closed) return;
    this.closed = true;
    this.afterClosedSubject.next(undefined);
    this.afterClosedSubject.complete();
  }
}
