import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface CheckboxGroupOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'ccms-checkbox-group',
  templateUrl: './checkbox-group.html',
  styleUrl: './checkbox-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxGroupComponent<T> {
  public title = input<string>(); // displayed as a header of the group
  public options = input.required<CheckboxGroupOption<T>[]>();
  public selectedValues = input.required<T[]>();
  public selectionChange = output<T[]>();
  public unselected = output<T>();
  public selected = output<T>();

  protected isValueSelected(value: T): boolean {
    return this.selectedValues().includes(value);
  }

  protected checkboxChange(value: T, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    const updated = checked
      ? [...this.selectedValues(), value]
      : this.selectedValues().filter((v) => v !== value);

    if (checked) {
      this.selected.emit(value);
    } else {
      this.unselected.emit(value);
    }

    this.selectionChange.emit(updated);
  }
}
