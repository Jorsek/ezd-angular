import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ccms-card',
  template: `<ng-content />`,
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
