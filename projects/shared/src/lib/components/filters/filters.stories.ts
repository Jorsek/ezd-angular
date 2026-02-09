import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { BehaviorSubject } from 'rxjs';
import { FilterComponent } from './filter/filter';
import { ListFilterComponent } from './list-filter/list-filter';
import { TaxonomyFilterComponent } from './taxonomy-filter/taxonomy-filter';
import { TextFilterComponent } from './text-filter/text-filter';
import { SearchFilterComponent } from './search-filter/search-filter';
import { RangeFilterComponent } from './range-filter/range-filter';
import { ViewFilter } from '../insights-views';
import { FilterOption } from '../../models/filter.interface';
import {
  PopupMenuComponent,
  PopupMenuItemComponent,
  PopupMenuTriggerDirective,
} from '../ccms-popup-menu';

const meta: Meta = {
  title: 'Filters',
  decorators: [
    moduleMetadata({
      imports: [
        FilterComponent,
        ListFilterComponent,
        TaxonomyFilterComponent,
        TextFilterComponent,
        SearchFilterComponent,
        RangeFilterComponent,
        PopupMenuComponent,
        PopupMenuItemComponent,
        PopupMenuTriggerDirective,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Filter chip components for building filter UIs.

## Components

- **ccms-filter** - Base filter chip wrapper
- **ccms-list-filter** - Dropdown filter with flat options
- **ccms-taxonomy-filter** - Dropdown filter with hierarchical options
- **ccms-text-filter** - Inline text input filter
- **ccms-range-filter** - Inline number/date range filter
- **ccms-search-filter** - Standalone search box
        `,
      },
    },
  },
};

export default meta;

// Sample data
const statusOptions$ = new BehaviorSubject<FilterOption[]>([
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]);

const productOptions$ = new BehaviorSubject<FilterOption[]>([
  {
    value: 'hardware',
    label: 'Hardware',
    children: [
      { value: 'laptop', label: 'Laptop' },
      { value: 'desktop', label: 'Desktop' },
      { value: 'tablet', label: 'Tablet' },
    ],
  },
  {
    value: 'software',
    label: 'Software',
    children: [
      { value: 'cloud', label: 'Cloud Services' },
      { value: 'on-prem', label: 'On-Premise' },
      { value: 'mobile', label: 'Mobile Apps' },
    ],
  },
  {
    value: 'services',
    label: 'Services',
    children: [
      { value: 'consulting', label: 'Consulting' },
      { value: 'support', label: 'Support' },
      { value: 'training', label: 'Training' },
    ],
  },
]);

const manyOptions$ = new BehaviorSubject<FilterOption[]>([
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
  { value: 'opt4', label: 'Option 4' },
  { value: 'opt5', label: 'Option 5' },
  { value: 'opt6', label: 'Option 6' },
  { value: 'opt7', label: 'Option 7' },
  { value: 'opt8', label: 'Option 8' },
  { value: 'opt9', label: 'Option 9' },
  { value: 'opt10', label: 'Option 10' },
]);

// ===========================================
// Filter (Base Component)
// ===========================================

export const FilterBase: StoryObj = {
  name: 'Filter (Base)',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-filter [label]="'Status'" [expandable]="true">
          <span class="filter-value">Active</span>
        </ccms-filter>

        <ccms-filter [label]="'Author'">
          <input type="text" class="filter-input" placeholder="Enter name..." />
        </ccms-filter>

        <ccms-filter [label]="'Type'" [expandable]="true" [removable]="false">
          <span class="filter-value">All</span>
        </ccms-filter>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: `
Base filter chip component. Use \`[expandable]="true"\` to show a chevron for dropdowns.

\`\`\`html
<ccms-filter [label]="'Status'" [expandable]="true">
  <span class="filter-value">Active</span>
</ccms-filter>
\`\`\`
        `,
      },
    },
  },
};

// ===========================================
// List Filter
// ===========================================

export const ListFilter: StoryObj = {
  name: 'List Filter',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-list-filter
          [label]="'Status'"
          [options]="statusOptions$"
          [selectedValues]="[]"
          (selectionChange)="onSelectionChange('status', $event)"
          (removed)="onRemoved('status')" />

        <ccms-list-filter
          [label]="'Priority'"
          [options]="priorityOptions$"
          [selectedValues]="['high']"
          (selectionChange)="onSelectionChange('priority', $event)"
          (removed)="onRemoved('priority')" />
      </div>
    `,
    props: {
      statusOptions$,
      priorityOptions$: new BehaviorSubject<FilterOption[]>([
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ]),
      onSelectionChange: (filter: string, values: string[]) =>
        console.log(`${filter} selection:`, values),
      onRemoved: (filter: string) => console.log(`${filter} removed`),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Dropdown filter with flat list of options and multi-select.

\`\`\`html
<ccms-list-filter
  [label]="'Status'"
  [options]="statusOptions$"
  [selectedValues]="selectedStatuses"
  (selectionChange)="onStatusChange($event)"
  (removed)="onRemoveFilter()" />
\`\`\`
        `,
      },
    },
  },
};

export const ListFilterWithSearch: StoryObj = {
  name: 'List Filter (with Search)',
  render: () => ({
    template: `
      <ccms-list-filter
        [label]="'Category'"
        [options]="manyOptions$"
        [selectedValues]="[]"
        [searchable]="true"
        (selectionChange)="onSelectionChange($event)" />
    `,
    props: {
      manyOptions$,
      onSelectionChange: (values: string[]) => console.log('Selected:', values),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
When \`[searchable]="true"\` or options exceed the threshold (default 7), a search box appears.
        `,
      },
    },
  },
};

// ===========================================
// Taxonomy Filter
// ===========================================

export const TaxonomyFilter: StoryObj = {
  name: 'Taxonomy Filter',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-taxonomy-filter
          [label]="'Product'"
          [options]="productOptions$"
          [selectedValues]="[]"
          (selectionChange)="onSelectionChange('product', $event)"
          (removed)="onRemoved('product')" />

        <ccms-taxonomy-filter
          [label]="'Category'"
          [options]="productOptions$"
          [selectedValues]="['laptop', 'cloud']"
          (selectionChange)="onSelectionChange('category', $event)"
          (removed)="onRemoved('category')" />
      </div>
    `,
    props: {
      productOptions$,
      onSelectionChange: (filter: string, values: string[]) =>
        console.log(`${filter} selection:`, values),
      onRemoved: (filter: string) => console.log(`${filter} removed`),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Dropdown filter with hierarchical options. Parent items are shown as group headers, children are selectable.

\`\`\`html
<ccms-taxonomy-filter
  [label]="'Product'"
  [options]="productOptions$"
  [selectedValues]="selectedProducts"
  (selectionChange)="onProductChange($event)" />
\`\`\`
        `,
      },
    },
  },
};

// ===========================================
// Text Filter
// ===========================================

export const TextFilter: StoryObj = {
  name: 'Text Filter',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-text-filter
          [label]="'Author'"
          [value]="''"
          [placeholder]="'Enter author name...'"
          (valueChange)="onValueChange('author', $event)"
          (removed)="onRemoved('author')" />

        <ccms-text-filter
          [label]="'Title'"
          [value]="'User Guide'"
          [placeholder]="'Enter title...'"
          (valueChange)="onValueChange('title', $event)"
          (removed)="onRemoved('title')" />
      </div>
    `,
    props: {
      onValueChange: (filter: string, value: string) => console.log(`${filter} value:`, value),
      onRemoved: (filter: string) => console.log(`${filter} removed`),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Inline text input filter with debounced value changes (400ms).

\`\`\`html
<ccms-text-filter
  [label]="'Author'"
  [value]="authorFilter"
  [placeholder]="'Enter name...'"
  (valueChange)="onAuthorChange($event)"
  (removed)="onRemoveFilter()" />
\`\`\`
        `,
      },
    },
  },
};

// ===========================================
// Range Filter
// ===========================================

export const RangeFilterNumber: StoryObj = {
  name: 'Range Filter (Number)',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-range-filter
          [label]="'Word Count'"
          [type]="'number'"
          [range]="{}"
          (valueChange)="onValueChange('wordCount', $event)"
          (removed)="onRemoved('wordCount')" />

        <ccms-range-filter
          [label]="'File Size'"
          [type]="'number'"
          [range]="{ min: 100, max: 5000 }"
          (valueChange)="onValueChange('fileSize', $event)"
          (removed)="onRemoved('fileSize')" />
      </div>
    `,
    props: {
      onValueChange: (filter: string, value: Pick<ViewFilter, 'range' | 'interval'>) =>
        console.log(`${filter} value:`, value),
      onRemoved: (filter: string) => console.log(`${filter} removed`),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Numeric range filter with min/max inputs. Debounces changes (400ms).

\`\`\`html
<ccms-range-filter
  [label]="'Word Count'"
  [type]="'number'"
  [range]="{ min: 100, max: 5000 }"
  (valueChange)="onRangeChange($event)"
  (removed)="onRemoveFilter()" />
\`\`\`
        `,
      },
    },
  },
};

export const RangeFilterDate: StoryObj = {
  name: 'Range Filter (Date)',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-range-filter
          [label]="'Created'"
          [type]="'date'"
          [interval]="{}"
          (valueChange)="onValueChange('createdUtc', $event)"
          (removed)="onRemoved('createdUtc')" />

        <ccms-range-filter
          [label]="'Last Modified'"
          [type]="'date'"
          [interval]="{ start: '2024-01-01', end: '2024-12-31' }"
          (valueChange)="onValueChange('lastModifiedUtc', $event)"
          (removed)="onRemoved('lastModifiedUtc')" />
      </div>
    `,
    props: {
      onValueChange: (filter: string, value: Pick<ViewFilter, 'range' | 'interval'>) =>
        console.log(`${filter} value:`, value),
      onRemoved: (filter: string) => console.log(`${filter} removed`),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Date range filter with start/end date inputs. Debounces changes (400ms).

\`\`\`html
<ccms-range-filter
  [label]="'Created'"
  [type]="'date'"
  [interval]="{ start: '2024-01-01', end: '2024-12-31' }"
  (valueChange)="onIntervalChange($event)"
  (removed)="onRemoveFilter()" />
\`\`\`
        `,
      },
    },
  },
};

export const RangeFilterNotRemovable: StoryObj = {
  name: 'Range Filter (Not Removable)',
  render: () => ({
    template: `
      <ccms-range-filter
        [label]="'Word Count'"
        [type]="'number'"
        [range]="{ min: 50 }"
        [removable]="false"
        (valueChange)="onValueChange($event)" />
    `,
    props: {
      onValueChange: (value: Pick<ViewFilter, 'range' | 'interval'>) =>
        console.log('value:', value),
    },
  }),
};

// ===========================================
// Search Filter
// ===========================================

export const SearchFilter: StoryObj = {
  name: 'Search Filter',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <ccms-search-filter
          [value]="''"
          [placeholder]="'Search resources...'"
          (valueChange)="onSearch($event)" />

        <ccms-search-filter
          [value]="'user guide'"
          [placeholder]="'Search...'"
          (valueChange)="onSearch($event)" />

        <ccms-search-filter
          [value]="'test'"
          [placeholder]="'Search...'"
          [clearable]="false"
          (valueChange)="onSearch($event)" />
      </div>
    `,
    props: {
      onSearch: (value: string) => console.log('Search:', value),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Standalone search box with icon, debounced input (400ms), and optional clear button.

\`\`\`html
<ccms-search-filter
  [value]="searchQuery"
  [placeholder]="'Search resources...'"
  [clearable]="true"
  (valueChange)="onSearch($event)" />
\`\`\`
        `,
      },
    },
  },
};

// ===========================================
// Combined Example
// ===========================================

export const FilterBar: StoryObj = {
  name: 'Filter Bar (Combined)',
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; padding: 12px; background: #fafafa; border-radius: 8px;">
        <ccms-search-filter
          [value]="''"
          [placeholder]="'Search...'"
          (valueChange)="onSearch($event)" />

        <ccms-list-filter
          [label]="'Status'"
          [options]="statusOptions$"
          [selectedValues]="['draft', 'review']"
          (selectionChange)="onSelectionChange('status', $event)"
          (removed)="onRemoved('status')" />

        <ccms-taxonomy-filter
          [label]="'Product'"
          [options]="productOptions$"
          [selectedValues]="[]"
          (selectionChange)="onSelectionChange('product', $event)"
          (removed)="onRemoved('product')" />

        <ccms-text-filter
          [label]="'Author'"
          [value]="''"
          [placeholder]="'Name...'"
          (valueChange)="onValueChange('author', $event)"
          (removed)="onRemoved('author')" />

        <ccms-range-filter
          [label]="'Word Count'"
          [type]="'number'"
          [range]="{}"
          (valueChange)="onRangeChange('wordCount', $event)"
          (removed)="onRemoved('wordCount')" />

        <ccms-range-filter
          [label]="'Created'"
          [type]="'date'"
          [interval]="{}"
          (valueChange)="onRangeChange('created', $event)"
          (removed)="onRemoved('created')" />
      </div>
    `,
    props: {
      statusOptions$,
      productOptions$,
      onSearch: (value: string) => console.log('Search:', value),
      onSelectionChange: (filter: string, values: string[]) =>
        console.log(`${filter} selection:`, values),
      onValueChange: (filter: string, value: string) => console.log(`${filter} value:`, value),
      onRangeChange: (filter: string, value: Pick<ViewFilter, 'range' | 'interval'>) =>
        console.log(`${filter} range:`, value),
      onRemoved: (filter: string) => console.log(`${filter} removed`),
    },
  }),
  parameters: {
    docs: {
      description: {
        story: `
Example of multiple filter components used together in a filter bar.
        `,
      },
    },
  },
};
