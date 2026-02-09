import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'badge' | 'line' | 'card';

@Component({
  selector: 'ccms-skeleton',
  template: `<span
    class="skeleton"
    [class.skeleton--text]="variant() === 'text'"
    [class.skeleton--badge]="variant() === 'badge'"
    [class.skeleton--line]="variant() === 'line'"
    [class.skeleton--card]="variant() === 'card'"
    [style.width]="width()"
  ></span>`,
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('text');
  width = input<string>('100%');
}
