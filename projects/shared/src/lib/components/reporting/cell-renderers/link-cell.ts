import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  computed,
  output,
} from '@angular/core';

/** Callback type for link click events */
export type LinkClickCallback = () => void;

/**
 * Renders a link cell for table columns.
 * Supports resource links, locale-specific links, click handlers, and search highlighting.
 *
 * @example
 * ```html
 * <!-- Simple resource link -->
 * <ccms-link-cell
 *   [text]="row['fileName']"
 *   [resourceUuid]="row['sourceResourceUuid']"
 * />
 *
 * <!-- Locale-specific link -->
 * <ccms-link-cell
 *   [text]="row['displayLocale']"
 *   [resourceUuid]="row['sourceResourceUuid']"
 *   [locale]="row['localizationLocaleCode']"
 * />
 *
 * <!-- Click-based link (for ngComponentOutlet) -->
 * cellComponent: {
 *   type: LinkCellComponent,
 *   inputs: (row) => ({
 *     text: row['jobId'],
 *     onClick: () => this.openJob(row['jobId']),
 *   }),
 * }
 * ```
 */
@Component({
  selector: 'ccms-link-cell',
  template: `
    @if (href(); as link) {
      <a class="cell-link" [href]="link" [innerHTML]="displayText()"></a>
    } @else if (hasClickHandler()) {
      <button
        class="cell-link cell-link--button"
        type="button"
        (click)="handleClick()"
        [innerHTML]="displayText()"
      ></button>
    } @else {
      <span [innerHTML]="displayText()"></span>
    }
  `,
  styles: `
    .cell-link {
      color: #1a73e8;
      text-decoration: none;
    }

    .cell-link:hover {
      text-decoration: underline;
    }

    .cell-link--button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      padding: 0;
    }

    .cell-link--button:hover {
      background: none;
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
export class LinkCellComponent {
  /** The text to display in the link (may contain HTML for search highlighting) */
  text = input<string | null | undefined>();

  /** The resource UUID for building the link */
  resourceUuid = input<string | null | undefined>();

  /** Optional locale code to append as query param */
  locale = input<string | null | undefined>();

  /** Callback for click (use with ngComponentOutlet) */
  onClick = input<LinkClickCallback>();

  /** Output event for click (standard Angular pattern) */
  linkClick = output<void>();

  /** Display text with fallback */
  protected displayText = computed(() => this.text() ?? '-');

  /** Whether a click handler is configured */
  protected hasClickHandler = computed(() => !!this.onClick());

  /** Computed href based on resourceUuid and optional locale */
  protected href = computed(() => {
    const uuid = this.resourceUuid();
    if (!uuid) return null;

    const localeCode = this.locale();
    if (localeCode) {
      return `/share/${uuid}?locale=${localeCode}`;
    }
    return `/share/${uuid}`;
  });

  protected handleClick(): void {
    const callback = this.onClick();
    if (callback) {
      callback();
    }
    this.linkClick.emit();
  }
}
