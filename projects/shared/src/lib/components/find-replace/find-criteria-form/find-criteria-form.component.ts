import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { ContentType } from '../../../services/find-replace/models';

/**
 * Find Criteria Form Component
 *
 * Manages search pattern input and search options
 * Uses model() for two-way binding with parent component
 */
@Component({
  selector: 'ccms-find-criteria-form',
  templateUrl: './find-criteria-form.component.html',
  styleUrl: './find-criteria-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindCriteriaFormComponent {
  // ========== Two-Way Bindings ==========

  /** Current search pattern */
  pattern = model.required<string>();

  /** Use regular expression search */
  useRegex = model<boolean>(false);

  /** Case sensitive matching */
  caseSensitive = model<boolean>(false);

  /** Match whole words only */
  wholeWordsOnly = model<boolean>(false);

  /** Ignore whitespace in matches */
  ignoreWhitespace = model<boolean>(false);

  /** Selected content types */
  contentTypes = model<ContentType[]>([]);

  /** XPath restriction expression */
  xpathRestriction = model<string>('');

  // ========== One-Way Inputs ==========

  /** Whether form is disabled (during search) */
  disabled = input<boolean>(false);

  // ========== Computed ==========

  /** Validate search pattern is not empty */
  protected isPatternValid = computed(() => this.pattern().trim().length > 0);

  // ========== All Content Types ==========

  protected readonly allContentTypes: ContentType[] = [
    'ELEMENT_CONTENT',
    'ATTRIBUTE_VALUES',
    'ELEMENT_NAMES',
    'ATTRIBUTE_NAMES',
    'CDATA_SECTIONS',
    'COMMENTS',
    'PROCESSING_INSTRUCTIONS',
    'DOCTYPE_DECLARATIONS',
    'ENTITIES',
  ];

  // ========== Methods ==========

  protected onPatternInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.pattern.set(target.value);
  }

  protected onUseRegexChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.useRegex.set(target.checked);
  }

  protected onCaseSensitiveChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.caseSensitive.set(target.checked);
  }

  protected onWholeWordsOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.wholeWordsOnly.set(target.checked);
  }

  protected onIgnoreWhitespaceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.ignoreWhitespace.set(target.checked);
  }

  protected toggleContentType(type: ContentType): void {
    const current = this.contentTypes();
    if (current.includes(type)) {
      this.contentTypes.set(current.filter((t) => t !== type));
    } else {
      this.contentTypes.set([...current, type]);
    }
  }

  protected selectAllContentTypes(): void {
    this.contentTypes.set([...this.allContentTypes]);
  }

  protected deselectAllContentTypes(): void {
    this.contentTypes.set([]);
  }

  protected isContentTypeSelected(type: ContentType): boolean {
    return this.contentTypes().includes(type);
  }

  protected onXpathRestrictionInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.xpathRestriction.set(target.value);
  }
}
