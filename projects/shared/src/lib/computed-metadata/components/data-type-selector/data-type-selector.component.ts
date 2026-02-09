import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  model,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { DataType, DATA_TYPE_LABELS } from '../../models';

interface DataTypeOption {
  value: DataType;
  label: string;
}

/**
 * 2x2 button grid for selecting data type.
 * Uses model() for two-way binding with parent form.
 */
@Component({
  selector: 'ccms-data-type-selector',
  templateUrl: './data-type-selector.component.html',
  styleUrl: './data-type-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup',
    '[attr.aria-label]': '"Data type selection"',
  },
})
export class DataTypeSelectorComponent implements AfterViewInit {
  @ViewChildren('radioBtn') private radioButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  value = model<DataType>('TEXT');

  protected readonly options: DataTypeOption[] = [
    { value: 'TEXT', label: DATA_TYPE_LABELS.TEXT },
    { value: 'DECIMAL', label: DATA_TYPE_LABELS.DECIMAL },
    { value: 'BOOLEAN', label: DATA_TYPE_LABELS.BOOLEAN },
    { value: 'DATE', label: DATA_TYPE_LABELS.DATE },
  ];

  private buttonsArray: ElementRef<HTMLButtonElement>[] = [];

  protected isSelected = computed(() => {
    const currentValue = this.value();
    return (type: DataType) => currentValue === type;
  });

  ngAfterViewInit(): void {
    this.buttonsArray = this.radioButtons.toArray();
  }

  protected selectType(type: DataType): void {
    this.value.set(type);
  }

  protected handleKeydown(event: KeyboardEvent, type: DataType): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectType(type);
    } else if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();
      const currentIndex = this.options.findIndex((o) => o.value === type);
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + direction + this.options.length) % this.options.length;
      this.selectType(this.options[nextIndex].value);
      this.buttonsArray[nextIndex]?.nativeElement.focus();
    }
  }
}
