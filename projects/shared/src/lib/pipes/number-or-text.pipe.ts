import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'numberOrText',
  standalone: true,
})
export class NumberOrTextPipe implements PipeTransform {
  private readonly decimal = new DecimalPipe(inject(LOCALE_ID));

  transform(value: string | number | null | undefined, digitsInfo?: string): string | null {
    if (value == null) return null; // handle null/undefined

    const num = typeof value === 'number' ? value : Number(value);
    if (!isNaN(num)) {
      // it's a number → format using Angular's DecimalPipe
      return this.decimal.transform(num, digitsInfo) ?? '';
    }

    // fallback: return text as-is
    return String(value);
  }
}
