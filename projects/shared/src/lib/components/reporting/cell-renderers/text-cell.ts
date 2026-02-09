import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  computed,
} from '@angular/core';

/**
 * Default text cell renderer with search highlighting support.
 * Use this as the base case for text columns.
 *
 * @example
 * ```typescript
 * cellComponent: {
 *   type: TextCellComponent,
 *   inputs: (row) => ({ value: row['title'] }),
 * }
 * ```
 */
@Component({
  selector: 'ccms-text-cell',
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
export class TextCellComponent {
  /** The text value (may contain HTML for search highlighting) */
  value = input<string | null | undefined>();

  /** Fallback text when value is empty */
  fallback = input<string>('-');

  /** Display value with fallback */
  protected displayValue = computed(() => {
    const val = this.value();
    if (val === null || val === undefined || val === '') {
      return this.fallback();
    }
    return val;
  });
}
