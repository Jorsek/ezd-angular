import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { ComputedMetadataComponent } from '../computed-metadata/computed-metadata.component';

/**
 * Extracted Metadata Popup Component
 *
 * Self-contained popup wrapper that provides overlay, close button, and Escape key handling.
 * Used for embedding Extracted Metadata in external applications (GWT).
 */
@Component({
  selector: 'ccms-computed-metadata-popup',
  templateUrl: './computed-metadata-popup.component.html',
  styleUrl: './computed-metadata-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [ComputedMetadataComponent],
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class ComputedMetadataPopupComponent {
  private elementRef = inject(ElementRef);

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
