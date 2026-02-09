import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComputedMetadataDefinition, CreateDefinitionRequest, DataType } from '../../models';
import { DataTypeSelectorComponent } from '../data-type-selector/data-type-selector.component';
import {
  XPathPreviewPanelComponent,
  XpathValidationError,
} from '../xpath-preview-panel/xpath-preview-panel.component';

/**
 * Form for creating or editing an extracted metadata definition.
 * Two-column layout with form fields on left and live XPath preview on right.
 */
@Component({
  selector: 'ccms-definition-form',
  templateUrl: './definition-form.component.html',
  styleUrl: './definition-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DataTypeSelectorComponent, XPathPreviewPanelComponent],
})
export class DefinitionFormComponent {
  private readonly MAX_XPATHS = 5;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  /** Definition to edit (null for create mode) */
  definition = input<ComputedMetadataDefinition | null>(null);

  /** Whether the form is currently submitting */
  isSubmitting = input(false);

  /** Emitted when form is submitted with valid data */
  save = output<CreateDefinitionRequest>();

  /** Emitted when user cancels */
  formCancel = output<void>();

  // Reactive form
  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    key: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9\-_]*$/)]],
    dataType: ['TEXT' as DataType],
    multiValue: [false],
    defaultValue: [''],
    xpaths: this.fb.array([this.fb.control('')]),
  });

  /** Track whether user has manually edited the key field */
  private keyManuallyEdited = false;

  /** Current data type for two-way binding with selector */
  protected dataType = signal<DataType>('TEXT');

  /** Current xpaths for preview panel */
  protected currentXpaths = signal<string[]>(['']);

  /** Current default value for preview panel */
  protected currentDefaultValue = signal<string>('');

  /** XPath validation errors keyed by index */
  protected xpathErrors = signal<Map<number, string>>(new Map());

  /** Current name for validation tracking */
  private currentName = signal<string>('');

  /** Current key for validation tracking */
  private currentKey = signal<string>('');

  // Computed
  protected isEditMode = computed(() => this.definition() !== null);
  protected formTitle = computed(() => (this.isEditMode() ? 'Edit Definition' : 'New Definition'));
  protected canAddMoreXpaths = computed(() => this.currentXpaths().length < this.MAX_XPATHS);
  protected keyHintText = computed(() =>
    this.isEditMode()
      ? 'Field name cannot be changed after creation'
      : 'XML-safe identifier (auto-generated from name)',
  );

  protected get xpathControls(): FormArray {
    return this.form.get('xpaths') as FormArray;
  }

  protected isValid = computed(() => {
    const nameValue = this.currentName();
    const keyValue = this.currentKey();
    const xpaths = this.currentXpaths();
    const nameValid = nameValue.trim().length > 0;
    const keyValid = /^[a-z][a-z0-9\-_]*$/.test(keyValue);
    const xpathsValid = xpaths.some((x) => x.trim().length > 0);
    return nameValid && keyValid && xpathsValid;
  });

  constructor() {
    // Initialize form when definition input changes
    effect(() => {
      const def = this.definition();
      const keyControl = this.form.get('key');
      if (def) {
        this.form.patchValue({
          name: def.name,
          key: def.key,
          dataType: def.dataType ?? 'TEXT',
          multiValue: def.multiValue ?? false,
          defaultValue: def.defaultValue || '',
        });
        this.currentName.set(def.name);
        this.currentKey.set(def.key);
        this.dataType.set(def.dataType ?? 'TEXT');
        this.keyManuallyEdited = true;
        // Reset xpaths array
        this.xpathControls.clear();
        const xpaths = def.xpaths.length > 0 ? def.xpaths : [''];
        xpaths.forEach((xpath) => this.xpathControls.push(this.fb.control(xpath)));
        this.currentXpaths.set(xpaths);
        this.currentDefaultValue.set(def.defaultValue || '');
        keyControl?.disable();
      } else {
        this.resetForm();
        keyControl?.enable();
      }
    });

    // Sync dataType signal with form
    effect(() => {
      const dt = this.dataType();
      this.form.get('dataType')?.setValue(dt, { emitEvent: false });
    });

    this.form
      .get('name')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name) => {
        this.currentName.set(name || '');
        if (!this.keyManuallyEdited && name) {
          const generatedKey = this.generateKeyFromName(name);
          this.form.get('key')?.setValue(generatedKey, { emitEvent: false });
          this.currentKey.set(generatedKey);
        }
      });

    this.form
      .get('key')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((key) => {
        this.currentKey.set(key || '');
      });

    this.form
      .get('defaultValue')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.currentDefaultValue.set(value || '');
      });
  }

  /** Convert name to XML-safe key (lowercase, replace invalid chars with hyphens) */
  private generateKeyFromName(name: string): string {
    let key = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (key && !/^[a-z]/.test(key)) {
      key = 'x-' + key;
    }

    return key;
  }

  /** Called when user manually edits the key field */
  protected onKeyInput(): void {
    this.keyManuallyEdited = true;
  }

  protected addXpath(): void {
    if (!this.canAddMoreXpaths()) {
      return;
    }
    this.xpathControls.push(this.fb.control(''));
    this.updateXpathsSignal();
  }

  protected removeXpath(index: number): void {
    if (this.xpathControls.length > 1) {
      this.xpathControls.removeAt(index);
      this.updateXpathsSignal();
      this.xpathErrors.update((errors) => {
        const newErrors = new Map<number, string>();
        errors.forEach((msg, i) => {
          if (i < index) {
            newErrors.set(i, msg);
          } else if (i > index) {
            newErrors.set(i - 1, msg);
          }
        });
        return newErrors;
      });
    }
  }

  protected onXpathInput(index: number): void {
    if (this.xpathErrors().has(index)) {
      this.xpathErrors.update((errors) => {
        const newErrors = new Map(errors);
        newErrors.delete(index);
        return newErrors;
      });
    }
    this.updateXpathsSignal();
  }

  private updateXpathsSignal(): void {
    const xpaths = this.xpathControls.controls.map((c) => c.value || '');
    this.currentXpaths.set(xpaths);
  }

  protected onSubmit(): void {
    if (!this.isValid() || this.isSubmitting()) return;

    const formValue = this.form.value;
    const request: CreateDefinitionRequest = {
      name: formValue.name?.trim() || '',
      key: formValue.key?.trim() || '',
      dataType: this.dataType(),
      multiValue: formValue.multiValue || false,
      xpaths: (formValue.xpaths || [])
        .map((x: string | null) => x?.trim() || '')
        .filter((x: string) => x.length > 0),
    };

    const defaultVal = formValue.defaultValue?.trim();
    if (defaultVal) {
      request.defaultValue = defaultVal;
    }

    this.save.emit(request);
  }

  protected onCancel(): void {
    this.formCancel.emit();
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      key: '',
      dataType: 'TEXT',
      multiValue: false,
      defaultValue: '',
    });
    this.currentName.set('');
    this.currentKey.set('');
    this.dataType.set('TEXT');
    this.keyManuallyEdited = false;
    this.xpathControls.clear();
    this.xpathControls.push(this.fb.control(''));
    this.currentXpaths.set(['']);
    this.currentDefaultValue.set('');
    this.xpathErrors.set(new Map());
  }

  setXpathError(xpath: string, message: string): void {
    const xpaths = this.currentXpaths();
    const index = xpaths.indexOf(xpath);
    if (index !== -1) {
      this.xpathErrors.update((errors) => new Map(errors).set(index, `Invalid xpath: ${message}`));
    }
  }

  clearXpathErrors(): void {
    this.xpathErrors.set(new Map());
  }

  protected onXpathValidationError(event: XpathValidationError): void {
    this.setXpathError(event.xpath, event.message);
  }
}
