import type { Meta, StoryObj } from '@storybook/angular';
import { AddFilterButtonComponent } from './add-filter-button';
import { FilterCategory } from '../../../models/filter.interface';

/** Base filters shown at top level */
const baseFilters: FilterCategory[] = [
  {
    id: 'dueDate',
    label: 'Due Date',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'single',
    searchable: false,
  },
  {
    id: 'job',
    label: 'Job(s)',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: false,
  },
  {
    id: 'jobStatus',
    label: 'Job Status',
    type: 'list',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: false,
  },
];

/** Metadata filters shown in submenu */
const metadataFilters: FilterCategory[] = [
  {
    id: 'metadata.author',
    label: 'Author',
    type: 'taxonomy',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: true,
    metadata: true,
  },
  {
    id: 'metadata.product',
    label: 'Product',
    type: 'taxonomy',
    default: false,
    removable: true,
    selectionMode: 'multi',
    searchable: true,
    metadata: true,
  },
  {
    id: 'metadata.version',
    label: 'Version',
    type: 'text',
    default: false,
    removable: true,
    metadata: true,
  },
];

/** Combined filters for stories */
const availableFilters: FilterCategory[] = [...baseFilters, ...metadataFilters];

const meta: Meta<AddFilterButtonComponent> = {
  title: 'Components/AddFilterButton',
  component: AddFilterButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    availableFilters: {
      control: 'object',
      description: 'Filter categories available to add',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A button that opens a dropdown to add new filter categories.

## Features

- **Base Filters**: Standard filters shown at top level of menu
- **Metadata Submenu**: Filters with \`metadata: true\` are grouped in a "Metadata" submenu
- **Click Outside**: Closes when clicking outside
- **Keyboard Accessible**: Supports Enter, Space, and Escape keys
- **Disabled State**: Disabled when no filters available

## Usage

\`\`\`html
<ccms-add-filter-button
  [availableFilters]="availableFilters"
  (filterSelected)="onFilterSelected($event)" />
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AddFilterButtonComponent>;

/**
 * Default state with base filters and metadata submenu.
 */
export const Default: Story = {
  args: {
    availableFilters: availableFilters,
  },
};

/**
 * Only base filters (no metadata submenu).
 */
export const BaseFiltersOnly: Story = {
  args: {
    availableFilters: baseFilters,
  },
};

/**
 * Only metadata filters (only submenu visible).
 */
export const MetadataFiltersOnly: Story = {
  args: {
    availableFilters: metadataFilters,
  },
};

/**
 * No filters available (disabled state).
 */
export const NoFiltersAvailable: Story = {
  args: {
    availableFilters: [],
  },
};

/**
 * Interactive example with selection handler.
 */
export const Interactive: Story = {
  args: {
    availableFilters: availableFilters,
  },
  render: (args) => ({
    props: {
      ...args,
      onFilterSelected: (filter: FilterCategory) => {
        console.log('Filter selected:', filter);
        alert(`Selected filter: ${filter.label}`);
      },
    },
    template: `
      <ccms-add-filter-button
        [availableFilters]="availableFilters"
        (filterSelected)="onFilterSelected($event)" />
    `,
  }),
};
