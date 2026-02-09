import type { Meta, StoryObj } from '@storybook/angular';
import { StatCardComponent } from './stat-card';

const meta: Meta<StatCardComponent> = {
  title: 'Components/StatCard',
  component: StatCardComponent,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label displayed above the value',
    },
    value: {
      control: 'text',
      description: 'The statistic value (number or text)',
    },
    icon: {
      control: 'select',
      options: [undefined, 'file-text', 'globe', 'briefcase', 'book-open'],
      description: 'Optional icon displayed to the left of the content',
    },
    info: {
      control: 'text',
      description: 'Tooltip text shown on the info icon',
    },
    highlight: {
      control: 'boolean',
      description: 'Highlight variant with indigo left border and value color',
    },
    suffix: {
      control: 'text',
      description: 'Text appended after the value in smaller font',
    },
    compact: {
      control: 'boolean',
      description: 'Use compact number formatting (e.g., 3.4K)',
    },
    compactThreshold: {
      control: 'number',
      description: 'Threshold above which compact notation is used (default: 1M)',
    },
  },
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="max-width: 300px;">${story().template ?? ''}</div>`,
    }),
  ],
};

export default meta;
type Story = StoryObj<StatCardComponent>;

/** Default stat card with a numeric value. */
export const Default: Story = {
  args: {
    label: 'Total Files',
    value: 3402,
  },
};

/** Stat card with a file-text icon. */
export const WithIcon: Story = {
  args: {
    label: 'Total Files',
    value: 3402,
    icon: 'file-text',
  },
};

/** Globe icon variant. */
export const GlobeIcon: Story = {
  args: {
    label: 'Locales',
    value: 12,
    icon: 'globe',
  },
};

/** Briefcase icon variant. */
export const BriefcaseIcon: Story = {
  args: {
    label: 'Active Jobs',
    value: 5,
    icon: 'briefcase',
  },
};

/** Highlighted card with indigo accent. */
export const Highlighted: Story = {
  args: {
    label: 'Localized Files',
    value: 1284,
    icon: 'file-text',
    highlight: true,
  },
};

/** Card with an info tooltip. */
export const WithInfo: Story = {
  args: {
    label: 'Total Words',
    value: 482300,
    info: 'Total word count across all files in this folder',
  },
};

/** Card with a suffix. */
export const WithSuffix: Story = {
  args: {
    label: 'Completion',
    value: 87,
    suffix: '%',
  },
};

/** Compact formatting with default threshold (1M). Large value shown in compact notation. */
export const CompactLargeValue: Story = {
  args: {
    label: 'Total Words',
    value: 2_450_000,
    compact: true,
  },
};

/** Compact formatting with low threshold (1K). Value of 3402 renders as "3.4K". */
export const CompactLowThreshold: Story = {
  args: {
    label: 'Total Files',
    value: 3402,
    icon: 'file-text',
    compact: true,
    compactThreshold: 1_000,
  },
};

/** Compact formatting where value is below the threshold — renders normally. */
export const CompactBelowThreshold: Story = {
  args: {
    label: 'Locales',
    value: 12,
    icon: 'globe',
    compact: true,
    compactThreshold: 1_000,
  },
};

/** String value instead of a number. */
export const StringValue: Story = {
  args: {
    label: 'Status',
    value: 'Active',
  },
};

/** All features combined. */
export const FullFeatured: Story = {
  args: {
    label: 'Localized Files',
    value: 48200,
    icon: 'file-text',
    highlight: true,
    info: 'Files with at least one completed translation',
    suffix: 'files',
    compact: true,
    compactThreshold: 10_000,
  },
};

/** Side-by-side comparison of all icon types. */
export const AllIcons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
        <ccms-stat-card label="Total Files" [value]="3402" icon="file-text" />
        <ccms-stat-card label="Locales" [value]="12" icon="globe" />
        <ccms-stat-card label="Active Jobs" [value]="5" icon="briefcase" />
        <ccms-stat-card label="Total Words" [value]="482300" icon="book-open" />
      </div>
    `,
  }),
};
