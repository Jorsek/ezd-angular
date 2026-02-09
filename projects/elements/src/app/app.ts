import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<!-- Angular CCMS root - custom elements registered -->',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
