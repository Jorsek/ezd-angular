import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NumberOrTextPipe } from '../../pipes/number-or-text.pipe';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';
import { CardComponent } from '@ccms/components/card/card';
import { IconComponent, IconName } from '@ccms/components/icon/icon';

/**
 * Stat Card Component
 *
 * A reusable card component for displaying summary statistics with an icon, label, and value.
 *
 * @example
 * ```html
 * <ccms-stat-card
 *   label="Localized Files"
 *   [value]="142"
 *   icon="file-text" />
 * ```
 */
@Component({
  selector: 'ccms-stat-card',
  imports: [NumberOrTextPipe, CompactNumberPipe, CardComponent, IconComponent],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.highlight]': 'highlight()',
  },
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input<IconName>();
  info = input<string>();
  highlight = input<boolean>(false);
  suffix = input<string>();
  compact = input<boolean>(false);
  compactThreshold = input<number | undefined>();
}
