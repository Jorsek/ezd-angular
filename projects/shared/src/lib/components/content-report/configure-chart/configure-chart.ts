import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { POPUP_REF, POPUP_DATA } from '../../ccms-popup';
import { Field } from '../../../models/filter-field.interface';

export enum ChartType {
  Bar = 'bar',
  Pie = 'pie',
}

export const CHART_TYPE_OPTIONS = [
  { value: ChartType.Bar, label: 'Bar' },
  { value: ChartType.Pie, label: 'Pie' },
] as const;

export enum ChartWidth {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
}

export const CHART_WIDTH_OPTIONS = [
  { value: ChartWidth.One, label: '1 Column (25%)' },
  { value: ChartWidth.Two, label: '2 Columns (50%)' },
  { value: ChartWidth.Three, label: '3 Columns (75%)' },
  { value: ChartWidth.Four, label: '4 Columns (100%)' },
] as const;

export enum ChartHeight {
  One = 1,
  Two = 2,
}

export const CHART_HEIGHT_OPTIONS = [
  { value: ChartHeight.One, label: '1 Row' },
  { value: ChartHeight.Two, label: '2 Rows' },
] as const;

export enum Measure {
  Objects = 'OBJECTS',
  Words = 'WORDS',
}

export const MEASURE_OPTIONS = [
  { value: Measure.Objects, label: 'Objects' },
  { value: Measure.Words, label: 'Words' },
] as const;

export enum GroupBy {
  ContentType = 'contentType',
  FileStatus = 'fileStatus',
  Owner = 'owner',
}

export const GROUP_BY_OPTIONS = [
  { value: GroupBy.ContentType, label: 'Content Type' },
  { value: GroupBy.FileStatus, label: 'File Status' },
  { value: GroupBy.Owner, label: 'Owner' },
] as const;

export enum TimeBucket {
  Day = 'DAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Quarter = 'QUARTER',
  Year = 'YEAR',
}

export const TIME_BUCKET_OPTIONS = [
  { value: TimeBucket.Day, label: 'Day' },
  { value: TimeBucket.Week, label: 'Week' },
  { value: TimeBucket.Month, label: 'Month' },
  { value: TimeBucket.Quarter, label: 'Quarter' },
  { value: TimeBucket.Year, label: 'Year' },
] as const;

/** All possible limit values from 1-200 */
const ALL_LIMIT_VALUES = Array.from({ length: 200 }, (_, i) => i + 1);

export interface ChartConfig {
  title: string;
  description: string;
  chartType: ChartType;
  measure: Measure;
  groupBy: string; // Static field, 'computed:key' for extracted metadata, or 'metadata:key' for custom metadata
  width: ChartWidth;
  /** Number of rows the chart spans. Default: 1 */
  height?: ChartHeight;
  stackBy?: string;
  timeBucket?: string;
  limitResults?: number;
}

/** Data passed to the configure chart popup */
export interface ConfigureChartData {
  /** Available fields for groupBy dropdown */
  fields: Field[];
  /** Existing config when editing a chart */
  config?: ChartConfig;
}

@Component({
  selector: 'ccms-configure-chart',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="configure-chart">
      <div class="configure-chart-header">
        <div>
          <h2 class="configure-chart-title">{{ isEditMode ? 'Edit Chart' : 'Configure Chart' }}</h2>
          <p class="configure-chart-description">
            Customize the data fields, visualization type, and layout for this chart.
          </p>
        </div>
        <button class="configure-chart-close" (click)="close()" aria-label="Close">&times;</button>
      </div>
      <div class="configure-chart-body">
        <div class="form-field">
          <label class="form-label" for="chartTitle">Title (Optional)</label>
          <input
            id="chartTitle"
            type="text"
            class="form-input"
            placeholder="Enter chart title..."
            [ngModel]="title()"
            (ngModelChange)="title.set($event)"
          />
        </div>
        <div class="form-field">
          <label class="form-label" for="chartDescription">Description (Optional)</label>
          <input
            id="chartDescription"
            type="text"
            class="form-input"
            placeholder="Enter chart description..."
            [ngModel]="description()"
            (ngModelChange)="description.set($event)"
          />
        </div>
        <div class="form-field">
          <label class="form-label" for="chartType">Chart Type</label>
          <div class="chart-type-buttons" role="radiogroup" aria-labelledby="chartTypeLabel">
            <button
              type="button"
              class="chart-type-btn"
              [class.selected]="selectedChartType() === ChartType.Bar"
              role="radio"
              [attr.aria-checked]="selectedChartType() === ChartType.Bar"
              (click)="selectChartType(ChartType.Bar)"
            >
              <svg
                class="chart-type-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="6" width="4" height="15" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
              <span class="chart-type-label">Bar</span>
            </button>
            <button
              type="button"
              class="chart-type-btn"
              [class.selected]="selectedChartType() === ChartType.Pie"
              role="radio"
              [attr.aria-checked]="selectedChartType() === ChartType.Pie"
              (click)="selectChartType(ChartType.Pie)"
            >
              <svg
                class="chart-type-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10h-10V2z" fill="currentColor" />
              </svg>
              <span class="chart-type-label">Pie</span>
            </button>
          </div>
        </div>
        @if (selectedChartType()) {
          <div class="form-field">
            <label class="form-label" for="measure">Measure</label>
            <select id="measure" class="form-select" (change)="onMeasureChange($event)">
              <option value="" disabled [selected]="!selectedMeasure()">Select Measure...</option>
              @for (option of measureOptions; track option.value) {
                <option [value]="option.value" [selected]="selectedMeasure() === option.value">
                  {{ option.label }}
                </option>
              }
            </select>
            <span class="form-hint">{{ measureHint() }}</span>
          </div>
          <div class="form-field">
            <label class="form-label" for="groupBy">Group By</label>
            <select id="groupBy" class="form-select" (change)="onGroupByChange($event)">
              <option value="" disabled [selected]="!selectedGroupBy()">Select Field...</option>
              @for (option of groupByOptions(); track option.value + option.label) {
                <option
                  [value]="option.value"
                  [disabled]="option.disabled"
                  [selected]="selectedGroupBy() === option.value"
                >
                  {{ option.label }}
                </option>
              }
            </select>
            <span class="form-hint">{{ groupByHint() }}</span>
          </div>
          @if (selectedChartType() === ChartType.Bar) {
            <div class="form-field">
              <label class="form-label" for="stackBy">Stack By (Optional)</label>
              <select id="stackBy" class="form-select" (change)="onStackByChange($event)">
                <option value="" [selected]="!selectedStackBy()">None</option>
                @for (option of stackByOptions(); track option.value + option.label) {
                  <option
                    [value]="option.value"
                    [disabled]="option.disabled"
                    [selected]="selectedStackBy() === option.value"
                  >
                    {{ option.label }}
                  </option>
                }
              </select>
            </div>
            <div class="form-field">
              <label class="form-label" for="timeBucket">Time Bucket (Optional)</label>
              <select id="timeBucket" class="form-select" (change)="onTimeBucketChange($event)">
                <option value="" [selected]="!selectedTimeBucket()">None</option>
                @for (option of timeBucketOptions; track option.value) {
                  <option [value]="option.value" [selected]="selectedTimeBucket() === option.value">
                    {{ option.label }}
                  </option>
                }
              </select>
            </div>
          }
          <div class="form-field">
            <label class="form-label" for="chartWidth">Width (Columns)</label>
            <select id="chartWidth" class="form-select" (change)="onChartWidthChange($event)">
              <option value="" disabled [selected]="!selectedChartWidth()">Select Width...</option>
              @for (option of chartWidthOptions; track option.value) {
                <option [value]="option.value" [selected]="selectedChartWidth() === option.value">
                  {{ option.label }}
                </option>
              }
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="limitResults">Limit Results (Optional)</label>
            <div class="combobox-container">
              <input
                #limitResultsInput
                id="limitResults"
                type="text"
                class="form-input combobox-input"
                placeholder="No limit"
                autocomplete="off"
                [value]="limitResultsInputValue()"
                (input)="onLimitResultsInput($event)"
                (focus)="onLimitResultsFocus()"
                (blur)="onLimitResultsBlur()"
                (keydown)="onLimitResultsKeydown($event)"
              />
            </div>
            <span class="form-hint">Type a number from 1-200 or select from suggestions</span>
          </div>
          @if (limitResultsDropdownOpen() && filteredLimitOptions().length > 0) {
            <ul
              class="combobox-dropdown"
              role="listbox"
              [style.top.px]="dropdownPosition().top"
              [style.left.px]="dropdownPosition().left"
              [style.width.px]="dropdownPosition().width"
            >
              @for (option of filteredLimitOptions(); track option; let i = $index) {
                <li
                  class="combobox-option"
                  [class.highlighted]="i === highlightedLimitIndex()"
                  role="option"
                  [attr.aria-selected]="selectedLimitResults() === option"
                  (mousedown)="selectLimitResult(option)"
                >
                  {{ option }}
                </li>
              }
            </ul>
          }
        }
      </div>
      <div class="configure-chart-footer">
        <button class="configure-chart-btn configure-chart-btn-secondary" (click)="close()">
          Cancel
        </button>
        <button
          class="configure-chart-btn configure-chart-btn-primary"
          [disabled]="!canSave()"
          (click)="save()"
        >
          {{ isEditMode ? 'Update Chart' : 'Add Chart' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .configure-chart {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        min-width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }

      .configure-chart-header {
        flex-shrink: 0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 16px 20px;
        background-color: #fff;
        border-radius: 8px 8px 0 0;
      }

      .configure-chart-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .configure-chart-description {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #6b7280;
      }

      .configure-chart-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .configure-chart-close:hover {
        color: #333;
      }

      .configure-chart-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .form-input {
        padding: 10px 12px;
        font-size: 14px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        outline: none;
      }

      .form-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .form-input::placeholder {
        color: #9ca3af;
      }

      .form-select {
        padding: 10px 12px;
        font-size: 14px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        outline: none;
        background-color: #fff;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
        height: auto;
      }

      .form-select:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .form-select option[value=''][disabled] {
        color: #9ca3af;
      }

      .form-hint {
        font-size: 12px;
        color: #6b7280;
        font-style: italic;
      }

      .configure-chart-footer {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        background-color: #fff;
        border-radius: 0 0 8px 8px;
      }

      .configure-chart-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }

      .configure-chart-btn-secondary {
        background-color: #fff;
        border: 1px solid rgba(0, 0, 0, 0.1);
        color: #333;
      }

      .configure-chart-btn-secondary:hover {
        background-color: #f5f5f5;
      }

      .configure-chart-btn-primary {
        background-color: #3b82f6;
        border: 1px solid #3b82f6;
        color: #fff;
      }

      .configure-chart-btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
      }

      .configure-chart-btn-primary:disabled {
        background-color: #93c5fd;
        border-color: #93c5fd;
        cursor: not-allowed;
      }

      .combobox-container {
        position: relative;
      }

      .combobox-input {
        width: 100%;
        box-sizing: border-box;
      }

      .combobox-dropdown {
        position: fixed;
        max-height: 200px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin: 0;
        padding: 4px 0;
        list-style: none;
        z-index: 10000;
      }

      .combobox-option {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
      }

      .combobox-option:hover,
      .combobox-option.highlighted {
        background-color: #f3f4f6;
      }

      .chart-type-buttons {
        display: flex;
        gap: 12px;
      }

      .chart-type-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 24px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        background-color: #fff;
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          background-color 0.15s ease,
          color 0.15s ease;
        color: #6b7280;
        min-width: 90px;
      }

      .chart-type-btn:hover {
        border-color: #3b82f6;
        background-color: #f8fafc;
      }

      .chart-type-btn:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      .chart-type-btn.selected {
        border-color: #3b82f6;
        background-color: #eff6ff;
        color: #3b82f6;
      }

      .chart-type-icon {
        width: 32px;
        height: 32px;
      }

      .chart-type-label {
        font-size: 14px;
        font-weight: 500;
      }
    `,
  ],
})
export class ConfigureChartComponent {
  private readonly popupRef = inject(POPUP_REF);
  private readonly popupData = inject(POPUP_DATA, { optional: true }) as ConfigureChartData | null;

  protected readonly ChartType = ChartType;
  protected readonly chartTypeOptions = CHART_TYPE_OPTIONS;
  protected readonly chartWidthOptions = CHART_WIDTH_OPTIONS;
  protected readonly measureOptions = MEASURE_OPTIONS;
  protected readonly timeBucketOptions = TIME_BUCKET_OPTIONS;
  protected readonly isEditMode = !!this.popupData?.config;
  protected readonly title = signal(this.popupData?.config?.title ?? '');
  protected readonly description = signal(this.popupData?.config?.description ?? '');
  protected readonly selectedChartType = signal<ChartType | null>(
    this.popupData?.config?.chartType ?? null,
  );
  protected readonly selectedChartWidth = signal<ChartWidth | null>(
    this.popupData?.config?.width ?? null,
  );
  protected readonly selectedMeasure = signal<Measure | null>(
    this.popupData?.config?.measure ?? null,
  );
  protected readonly selectedGroupBy = signal<string | null>(
    this.popupData?.config?.groupBy ?? null,
  );
  protected readonly selectedStackBy = signal<string | null>(
    this.popupData?.config?.stackBy ?? null,
  );
  protected readonly selectedTimeBucket = signal<string | null>(
    this.popupData?.config?.timeBucket ?? null,
  );
  protected readonly selectedLimitResults = signal<number | null>(
    this.popupData?.config?.limitResults ?? null,
  );

  // Combobox state for limit results
  protected readonly limitResultsInput =
    viewChild<ElementRef<HTMLInputElement>>('limitResultsInput');
  protected readonly limitResultsDropdownOpen = signal(false);
  protected readonly limitResultsInputText = signal(
    this.popupData?.config?.limitResults?.toString() ?? '',
  );
  protected readonly highlightedLimitIndex = signal(-1);
  protected readonly dropdownPosition = signal({ top: 0, left: 0, width: 0 });

  protected readonly limitResultsInputValue = computed(() => {
    const selected = this.selectedLimitResults();
    const inputText = this.limitResultsInputText();
    // If dropdown is open, show what user is typing; otherwise show selected value
    if (this.limitResultsDropdownOpen()) {
      return inputText;
    }
    return selected?.toString() ?? '';
  });

  protected readonly filteredLimitOptions = computed(() => {
    const input = this.limitResultsInputText().trim();
    if (!input) {
      // Show common values when input is empty
      return [5, 10, 15, 20, 25, 50, 75, 100, 150, 200];
    }
    // Filter to numbers that start with the input
    return ALL_LIMIT_VALUES.filter((n) => n.toString().startsWith(input)).slice(0, 20);
  });

  // Fields passed from parent component
  private readonly allFields = this.popupData?.fields ?? [];

  // Build grouped options from all fields
  protected readonly groupByOptions = computed<
    { value: string; label: string; disabled?: boolean }[]
  >(() => {
    const fields = this.allFields;

    // Separate fields by prefix
    const staticOptions = fields
      .filter((f) => !f.name.startsWith('metadata:') && !f.name.startsWith('computed:'))
      .map((f) => ({ value: f.name, label: f.displayName, disabled: false }));
    const customMetadataOptions = fields
      .filter((f) => f.name.startsWith('metadata:'))
      .map((f) => ({ value: f.name, label: f.displayName, disabled: false }));
    const computedOptions = fields
      .filter((f) => f.name.startsWith('computed:'))
      .map((f) => ({ value: f.name, label: f.displayName, disabled: false }));

    const hasStaticOptions = staticOptions.length > 0;
    const hasCustomMetadataOptions = customMetadataOptions.length > 0;
    const hasComputedOptions = computedOptions.length > 0;

    // If only static options (or no options at all), return without headers
    if (!hasCustomMetadataOptions && !hasComputedOptions) {
      return staticOptions;
    }

    const result: { value: string; label: string; disabled?: boolean }[] = [];

    if (hasStaticOptions) {
      result.push({ value: '', label: '── Standard Fields ──', disabled: true });
      result.push(...staticOptions);
    }

    if (hasCustomMetadataOptions) {
      result.push({ value: '', label: '── Custom Metadata ──', disabled: true });
      result.push(...customMetadataOptions);
    }

    if (hasComputedOptions) {
      result.push({ value: '', label: '── Extracted Metadata ──', disabled: true });
      result.push(...computedOptions);
    }

    return result;
  });

  protected readonly canSave = computed(() => {
    return (
      this.selectedChartType() !== null &&
      this.selectedMeasure() !== null &&
      this.selectedGroupBy() !== null &&
      this.selectedChartWidth() !== null
    );
  });

  protected readonly measureHint = computed(() => {
    const chartType = this.selectedChartType();
    if (!chartType) return '';
    return chartType === ChartType.Bar ? 'Determines bar height' : 'Determines slice size';
  });

  protected readonly groupByHint = computed(() => {
    const chartType = this.selectedChartType();
    if (!chartType) return '';
    return chartType === ChartType.Bar
      ? 'Determines bar categories'
      : 'Determines slice categories';
  });

  /** Stack By options: same structure as Group By but excludes the selected groupBy field */
  protected readonly stackByOptions = computed<
    { value: string; label: string; disabled?: boolean }[]
  >(() => {
    const fields = this.allFields;
    const selectedGroup = this.selectedGroupBy();

    // Filter function to exclude the selected groupBy
    const excludeSelected = (f: { name: string }) => f.name !== selectedGroup;

    // Separate fields by prefix, excluding the selected groupBy
    const staticOptions = fields
      .filter((f) => !f.name.startsWith('metadata:') && !f.name.startsWith('computed:'))
      .filter(excludeSelected)
      .map((f) => ({ value: f.name, label: f.displayName, disabled: false }));
    const customMetadataOptions = fields
      .filter((f) => f.name.startsWith('metadata:'))
      .filter(excludeSelected)
      .map((f) => ({ value: f.name, label: f.displayName, disabled: false }));
    const computedOptions = fields
      .filter((f) => f.name.startsWith('computed:'))
      .filter(excludeSelected)
      .map((f) => ({ value: f.name, label: f.displayName, disabled: false }));

    const hasStaticOptions = staticOptions.length > 0;
    const hasCustomMetadataOptions = customMetadataOptions.length > 0;
    const hasComputedOptions = computedOptions.length > 0;

    // If only static options (or no options at all), return without headers
    if (!hasCustomMetadataOptions && !hasComputedOptions) {
      return staticOptions;
    }

    const result: { value: string; label: string; disabled?: boolean }[] = [];

    if (hasStaticOptions) {
      result.push({ value: '', label: '── Standard Fields ──', disabled: true });
      result.push(...staticOptions);
    }

    if (hasCustomMetadataOptions) {
      result.push({ value: '', label: '── Custom Metadata ──', disabled: true });
      result.push(...customMetadataOptions);
    }

    if (hasComputedOptions) {
      result.push({ value: '', label: '── Extracted Metadata ──', disabled: true });
      result.push(...computedOptions);
    }

    return result;
  });

  selectChartType(chartType: ChartType) {
    this.selectedChartType.set(chartType);
  }

  onChartWidthChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value) as ChartWidth;
    this.selectedChartWidth.set(value);
  }

  onMeasureChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Measure;
    this.selectedMeasure.set(value);
  }

  onGroupByChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || null;
    this.selectedGroupBy.set(value);
    // Clear stackBy if it matches the new groupBy
    if (value && this.selectedStackBy() === value) {
      this.selectedStackBy.set(null);
    }
  }

  onStackByChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || null;
    this.selectedStackBy.set(value);
  }

  onTimeBucketChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || null;
    this.selectedTimeBucket.set(value);
  }

  onLimitResultsFocus(): void {
    const input = this.limitResultsInput()?.nativeElement;
    if (input) {
      const rect = input.getBoundingClientRect();
      const dropdownMaxHeight = 200;
      const spacing = 4;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom - spacing;
      const spaceAbove = rect.top - spacing;
      const fitsBelow = spaceBelow >= dropdownMaxHeight;

      // Position above if not enough space below (and more space above)
      let top: number;
      if (fitsBelow || spaceBelow >= spaceAbove) {
        top = rect.bottom + spacing;
      } else {
        top = rect.top - spacing - Math.min(dropdownMaxHeight, spaceAbove);
      }

      // Ensure dropdown doesn't go off the right edge
      let left = rect.left;
      if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - spacing;
      }

      this.dropdownPosition.set({
        top,
        left,
        width: rect.width,
      });
    }
    this.limitResultsDropdownOpen.set(true);
  }

  onLimitResultsInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.limitResultsInputText.set(value);
    this.highlightedLimitIndex.set(-1);

    // If user types a valid number, update the selection
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 200) {
      this.selectedLimitResults.set(num);
    } else if (value === '') {
      this.selectedLimitResults.set(null);
    }
  }

  onLimitResultsBlur(): void {
    // Delay to allow click on dropdown option to register
    setTimeout(() => {
      this.limitResultsDropdownOpen.set(false);
      this.highlightedLimitIndex.set(-1);
      // Sync input text with selected value
      const selected = this.selectedLimitResults();
      this.limitResultsInputText.set(selected?.toString() ?? '');
    }, 150);
  }

  onLimitResultsKeydown(event: KeyboardEvent): void {
    const options = this.filteredLimitOptions();
    const currentIndex = this.highlightedLimitIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.limitResultsDropdownOpen.set(true);
        this.highlightedLimitIndex.set(Math.min(currentIndex + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedLimitIndex.set(Math.max(currentIndex - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < options.length) {
          this.selectLimitResult(options[currentIndex]);
        }
        this.limitResultsDropdownOpen.set(false);
        break;
      case 'Escape':
        this.limitResultsDropdownOpen.set(false);
        this.highlightedLimitIndex.set(-1);
        break;
    }
  }

  selectLimitResult(value: number): void {
    this.selectedLimitResults.set(value);
    this.limitResultsInputText.set(value.toString());
    this.limitResultsDropdownOpen.set(false);
    this.highlightedLimitIndex.set(-1);
  }

  close(): void {
    this.popupRef.close();
  }

  save(): void {
    if (!this.canSave()) return;

    const config: ChartConfig = {
      title: this.title(),
      description: this.description(),
      chartType: this.selectedChartType()!,
      measure: this.selectedMeasure()!,
      groupBy: this.selectedGroupBy()!,
      width: this.selectedChartWidth()!,
      stackBy: this.selectedStackBy() ?? undefined,
      timeBucket: this.selectedTimeBucket() ?? undefined,
      limitResults: this.selectedLimitResults() ?? undefined,
    };

    this.popupRef.close(config);
  }
}
