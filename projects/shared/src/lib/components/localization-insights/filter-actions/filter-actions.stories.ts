import type { Meta, StoryObj } from '@storybook/angular';
import { FilterActionsComponent } from './filter-actions';

const meta: Meta<FilterActionsComponent> = {
  title: 'Components/FilterActions',
  component: FilterActionsComponent,
  tags: ['autodocs'],
  argTypes: {
    hasFilters: {
      control: 'boolean',
      description: 'Whether any filters are active (enables Clear button)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
Filter action button for clearing filter selections.

## Features

- **Clear Button**: Enabled when filters are active, disabled otherwise
- **Auto-Apply**: Filters are automatically applied on change (Apply button removed)
- **Keyboard Accessible**: Supports Enter and Space keys

## Usage

\`\`\`html
<ccms-filter-actions
  [hasFilters]="true"
  (clearClick)="onClear()" />
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FilterActionsComponent>;

/**
 * Default state - no filters active.
 */
export const Default: Story = {
  args: {
    hasFilters: false,
  },
};

/**
 * With active filters - Clear button enabled.
 */
export const WithFilters: Story = {
  args: {
    hasFilters: true,
  },
};

/**
 * Interactive example with click handler.
 */
export const Interactive: Story = {
  args: {
    hasFilters: true,
  },
  render: (args) => ({
    props: {
      ...args,
      onClear: () => {
        console.log('Clear clicked');
        alert('Filters cleared!');
      },
    },
    template: `
      <ccms-filter-actions
        [hasFilters]="hasFilters"
        (clearClick)="onClear()" />
    `,
  }),
};
