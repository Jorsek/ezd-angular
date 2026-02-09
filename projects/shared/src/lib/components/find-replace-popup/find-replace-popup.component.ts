import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { FindReplaceComponent } from '../find-replace/find-replace.component';
import { SearchContext } from '../../services/find-replace/models';

/**
 * Find/Replace Popup Component
 *
 * Self-contained popup wrapper that provides overlay, close button, and Escape key handling.
 * Used for embedding Find/Replace in external applications (GWT).
 *
 * Accepts optional inputs to pre-populate and lock the search scope:
 * - resourceUuid: Pre-select a specific resource (uses RESOURCE_WITH_DEPENDENCIES)
 * - directoryUuid: Pre-select a directory (uses DIRECTORY_SCOPE with recursive=true)
 * - explicitOnly: When true, only search explicit dependencies (for resource scope)
 *
 * When scope is pre-populated, the scope selector becomes read-only.
 */
@Component({
  selector: 'ccms-find-replace-popup',
  templateUrl: './find-replace-popup.component.html',
  styleUrl: './find-replace-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [FindReplaceComponent],
})
export class FindReplacePopupComponent {
  private elementRef = inject(ElementRef);

  // Inputs from GWT (kebab-case as HTML attributes)
  resourceUuid = input<string>('');
  directoryUuid = input<string>('');
  explicitOnly = input<boolean>(false);

  // Computed: determine context type from provided inputs
  protected initialContextType = computed<SearchContext['type']>(() => {
    if (this.resourceUuid()) {
      return 'RESOURCE_WITH_DEPENDENCIES';
    }
    if (this.directoryUuid()) {
      return 'DIRECTORY_SCOPE';
    }
    return 'SINGLE_RESOURCE'; // default when nothing provided
  });

  closeRequest = output<void>();

  protected onOverlayClick(event: MouseEvent): void {
    // Only close if clicking the overlay itself, not the popup content
    if ((event.target as HTMLElement).classList.contains('ccms-overlay')) {
      this.close();
    }
  }

  protected close(): void {
    this.closeRequest.emit();
    // Self-remove from DOM when used as custom element
    this.elementRef.nativeElement.remove();
  }
}
