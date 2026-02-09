import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';

/**
 * Renders cell content with HTML highlighting support.
 * Used for search result highlighting where the server returns
 * pre-highlighted HTML (e.g., with <em class="search-highlight"> tags).
 *
 * @example
 * ```html
 * <ccms-highlight-cell [html]="row['title']" />
 * ```
 */
@Component({
  selector: 'ccms-highlight-cell',
  template: `<span [innerHTML]="html() ?? '-'"></span>`,
  styles: `
    em.search-highlight {
      background-color: #fff3cd;
      font-style: normal;
      padding: 0 2px;
      border-radius: 2px;
    }

    /* Legacy support for <mark> tags */
    mark {
      background-color: #fff3cd;
      padding: 0 2px;
      border-radius: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class HighlightCellComponent {
  /** The HTML content to render (may contain highlight markup) */
  html = input<string | null | undefined>();
}
