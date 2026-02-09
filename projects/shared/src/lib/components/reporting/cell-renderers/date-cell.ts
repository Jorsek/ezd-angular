import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  computed,
} from '@angular/core';

/** Date format options */
export type DateFormat = 'short' | 'medium' | 'long' | 'datetime' | 'date' | 'time';

/**
 * Renders a formatted date cell.
 * Converts UTC dates to local time for display.
 * Supports various date formats and handles invalid/missing dates gracefully.
 *
 * @example
 * ```html
 * <ccms-date-cell [value]="row['dueUtc']" format="datetime" />
 * <ccms-date-cell [value]="row['createdAt']" format="date" />
 * ```
 */
@Component({
  selector: 'ccms-date-cell',
  template: `<span [innerHTML]="displayValue()"></span>`,
  styles: `
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
export class DateCellComponent {
  /** The date value (ISO string from backend - always UTC) */
  value = input<string | number | Date | null | undefined>();

  /** The format to use for display */
  format = input<DateFormat>('datetime');

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

    const date = this.parseDate(val);
    if (!date || isNaN(date.getTime())) {
      return typeof val === 'string' ? val : '-';
    }

    return this.formatDate(date);
  });

  /**
   * Parse the input value into a Date object.
   * All backend dates are UTC - append 'Z' if missing to ensure proper parsing.
   */
  private parseDate(val: string | number | Date): Date | null {
    if (val instanceof Date) {
      return val;
    }

    if (typeof val === 'number') {
      return new Date(val);
    }

    // Backend dates are UTC - ensure proper UTC parsing by appending Z if missing
    if (!val.endsWith('Z') && !val.includes('+') && !val.includes('-', 10)) {
      return new Date(val + 'Z');
    }

    return new Date(val);
  }

  private formatDate(date: Date): string {
    const loc = this.locale();
    const fmt = this.format();

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    switch (fmt) {
      case 'short':
        return date.toLocaleDateString(loc, { year: '2-digit', month: 'numeric', day: 'numeric' });
      case 'medium':
        return date.toLocaleDateString(loc, dateOptions);
      case 'long':
        return date.toLocaleDateString(loc, { ...dateOptions, month: 'long', weekday: 'long' });
      case 'date':
        return date.toLocaleDateString(loc, dateOptions);
      case 'time':
        return date.toLocaleTimeString(loc, timeOptions);
      case 'datetime':
      default:
        return date.toLocaleString(loc, { ...dateOptions, ...timeOptions });
    }
  }
}
