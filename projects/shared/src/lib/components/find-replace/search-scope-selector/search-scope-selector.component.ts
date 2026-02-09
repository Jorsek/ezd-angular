import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { SearchContext } from '../../../services/find-replace/models';
import { Validators } from '../../../utils/validators.util';

/**
 * Search Scope Selector Component
 *
 * Manages search context/scope selection
 * Uses model() for two-way binding with parent component
 */
@Component({
  selector: 'ccms-search-scope-selector',
  templateUrl: './search-scope-selector.component.html',
  styleUrl: './search-scope-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchScopeSelectorComponent {
  // ========== Two-Way Bindings ==========

  /** Context type selection */
  contextType = model.required<SearchContext['type']>();

  /** Resource UUID for single resource or dependency searches */
  resourceUuid = model<string>('');

  /** Directory UUID for directory scope searches */
  directoryUuid = model<string>('');

  /** Recursive directory search */
  recursive = model<boolean>(false);

  /** Include only explicit dependencies */
  explicitOnly = model<boolean>(false);

  // ========== One-Way Inputs ==========

  /** Whether form is disabled */
  disabled = input<boolean>(false);

  // ========== Computed ==========

  /** Validate UUID format */
  protected isContextValid = computed(() => {
    const ctxType = this.contextType();
    if (ctxType === 'SINGLE_RESOURCE' || ctxType === 'RESOURCE_WITH_DEPENDENCIES') {
      return Validators.isValidUuid(this.resourceUuid());
    } else if (ctxType === 'DIRECTORY_SCOPE') {
      return Validators.isValidUuid(this.directoryUuid());
    }
    return false;
  });

  // ========== Methods ==========

  protected onContextTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.contextType.set(target.value as SearchContext['type']);
  }

  protected onResourceUuidInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.resourceUuid.set(target.value);
  }

  protected onDirectoryUuidInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.directoryUuid.set(target.value);
  }

  protected onRecursiveChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.recursive.set(target.checked);
  }

  protected onExplicitOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.explicitOnly.set(target.checked);
  }
}
