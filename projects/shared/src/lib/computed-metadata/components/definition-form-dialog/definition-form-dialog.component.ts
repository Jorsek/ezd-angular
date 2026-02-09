import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ComputedMetadataDefinition, CreateDefinitionRequest } from '../../models';
import { DefinitionFormComponent } from '../definition-form/definition-form.component';

@Component({
  selector: 'ccms-definition-form-dialog',
  templateUrl: './definition-form-dialog.component.html',
  styleUrl: './definition-form-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [DefinitionFormComponent],
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class DefinitionFormDialogComponent {
  private formComponent = viewChild(DefinitionFormComponent);

  definition = input<ComputedMetadataDefinition | null>(null);
  isSubmitting = input(false);

  save = output<CreateDefinitionRequest>();
  closeRequest = output<void>();

  protected isEditMode = computed(() => this.definition() !== null);
  protected title = computed(() =>
    this.isEditMode() ? 'Edit Computed Field' : 'Create Computed Field',
  );

  protected onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.close();
    }
  }

  protected close(): void {
    this.closeRequest.emit();
  }

  protected onSave(request: CreateDefinitionRequest): void {
    this.save.emit(request);
  }

  setXpathError(xpath: string, message: string): void {
    this.formComponent()?.setXpathError(xpath, message);
  }
}
