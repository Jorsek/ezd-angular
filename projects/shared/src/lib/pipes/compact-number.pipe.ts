import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'compactNumber',
  standalone: true,
})
export class CompactNumberPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly DEFAULT_THRESHOLD = 1_000_000;

  transform(
    value: number | string | null | undefined,
    maximumFractionDigits = 1,
    threshold?: number,
  ): string {
    if (value == null) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    if (num >= (threshold ?? this.DEFAULT_THRESHOLD)) {
      return new Intl.NumberFormat(this.locale, {
        notation: 'compact',
        maximumFractionDigits,
      }).format(num);
    }

    return new Intl.NumberFormat(this.locale).format(num);
  }
}
