import { Meta, StoryObj } from '@storybook/angular';
import { ReportSectionComponent } from './report-section';

const meta: Meta<ReportSectionComponent> = {
  title: 'Reporting/ReportSection',
  component: ReportSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Section title displayed in the header',
    },
    summaryText: {
      control: 'text',
      description: 'Summary text displayed below the title',
    },
    icon: {
      control: 'text',
      description: 'Icon displayed before the title (emoji or icon identifier)',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the section is in a loading state',
    },
  },
};

export default meta;
type Story = StoryObj<ReportSectionComponent>;

export const WithIconAndDescription: Story = {
  args: {
    title: 'Topic Reuse',
    summaryText: 'How many times topics are reused across publications',
    icon: '📊',
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section
        [title]="title"
        [summaryText]="summaryText"
        [icon]="icon"
        [loading]="loading"
      >
        <div style="padding: 16px; background: #f3f4f6; border-radius: 8px;">
          Section content goes here
        </div>
      </ccms-report-section>
    `,
  }),
};

export const WithIconOnly: Story = {
  args: {
    title: 'Media Assets',
    icon: '🖼️',
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section
        [title]="title"
        [icon]="icon"
        [loading]="loading"
      >
        <div style="padding: 16px; background: #f3f4f6; border-radius: 8px;">
          Content with icon but no description
        </div>
      </ccms-report-section>
    `,
  }),
};

export const WithDescriptionOnly: Story = {
  args: {
    title: 'Text Reuse',
    summaryText: 'Statistics about word-level content reuse',
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section
        [title]="title"
        [summaryText]="summaryText"
        [loading]="loading"
      >
        <div style="padding: 16px; background: #f3f4f6; border-radius: 8px;">
          Content with description but no icon
        </div>
      </ccms-report-section>
    `,
  }),
};

export const TitleOnly: Story = {
  args: {
    title: 'Simple Section',
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section [title]="title" [loading]="loading">
        <div style="padding: 16px; background: #f3f4f6; border-radius: 8px;">
          Header with title only - no icon or description
        </div>
      </ccms-report-section>
    `,
  }),
};

export const NoHeader: Story = {
  args: {
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section [loading]="loading">
        <div style="padding: 16px; background: #f3f4f6; border-radius: 8px;">
          No header rendered - just content
        </div>
      </ccms-report-section>
    `,
  }),
};

export const Loading: Story = {
  args: {
    title: 'Topic Reuse',
    summaryText: 'How many times topics are reused across publications',
    icon: '📊',
    loading: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section
        [title]="title"
        [summaryText]="summaryText"
        [icon]="icon"
        [loading]="loading"
      >
        <div style="padding: 16px; background: #e5e7eb; border-radius: 8px; color: #9ca3af;">
          Child content (loading state applied to host)
        </div>
      </ccms-report-section>
    `,
  }),
};

export const WithMultipleChildren: Story = {
  args: {
    title: 'Reuse Metrics',
    summaryText: 'Key metrics for content reuse analysis',
    icon: '📈',
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-report-section
        [title]="title"
        [summaryText]="summaryText"
        [icon]="icon"
        [loading]="loading"
      >
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          <div style="padding: 16px; background: #dbeafe; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">42</div>
            <div style="color: #6b7280;">Unique Topics</div>
          </div>
          <div style="padding: 16px; background: #dbeafe; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">128</div>
            <div style="color: #6b7280;">Total Usage</div>
          </div>
          <div style="padding: 16px; background: #dbeafe; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">3.1</div>
            <div style="color: #6b7280;">Avg Reuse</div>
          </div>
        </div>
      </ccms-report-section>
    `,
  }),
};
