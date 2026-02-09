import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  computed,
} from '@angular/core';

/** Number format options */
export type NumberFormat = 'integer' | 'decimal' | 'percent' | 'compact';

/**
 * Renders a formatted number cell.
 * Supports various number formats and handles invalid/missing values gracefully.
 *
 * @example
 * ```html
 * <ccms-number-cell [value]="row['wordCount']" format="integer" />
 * <ccms-number-cell [value]="row['progress']" format="percent" />
 * <ccms-number-cell [value]="row['fileSize']" format="compact" />
 * ```
 */
@Component({
  selector: 'ccms-number-cell',
  template: `<span [innerHTML]="displayValue()"></span>`,
  styles: `
    ccms-number-cell {
      font-variant-numeric: tabular-nums;
    }

    em.search-highlight {
      background-color: #fff3cd;
      font-style: normal;
      padding: 0 2px;
      border-radius: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NumberCellComponent {
  /** The number value */
  value = input<string | number | null | undefined>();

  /** The format to use for display */
  format = input<NumberFormat>('integer');

  /** Number of decimal places (for 'decimal' format) */
  decimals = input<number>(2);

  /** Locale for formatting (defaults to browser locale) */
  locale = input<string | undefined>();

  /** Computed display value */
  protected displayValue = computed(() => {
    const val = this.value();
    if (val === null || val === undefined || val === '') {
      return '-';
    }

    // If the value is already a string with HTML (search highlighting), return as-is
    if (typeof val === 'string' && val.includes('<em')) {
      return val;
    }

    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) {
      return typeof val === 'string' ? val : '-';
    }

    return this.formatNumber(num);
  });

  private formatNumber(num: number): string {
    const loc = this.locale();
    const fmt = this.format();

    switch (fmt) {
      case 'integer':
        return num.toLocaleString(loc, {
          maximumFractionDigits: 0,
        });
      case 'decimal':
        return num.toLocaleString(loc, {
          minimumFractionDigits: this.decimals(),
          maximumFractionDigits: this.decimals(),
        });
      case 'percent':
        return num.toLocaleString(loc, {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        });
      case 'compact':
        return num.toLocaleString(loc, {
          notation: 'compact',
          compactDisplay: 'short',
        });
      default:
        return num.toLocaleString(loc);
    }
  }
}
