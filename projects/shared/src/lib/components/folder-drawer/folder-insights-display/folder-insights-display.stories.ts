import { Meta, StoryObj } from '@storybook/angular';
import { FolderInsightsDisplayComponent } from './folder-insights-display.component';
import { ContentInsightsSummaries } from '@ccms/services/content-report.service';

const sampleData: ContentInsightsSummaries = {
  callouts: {
    TOTAL_OBJECTS: 3402,
    TOTAL_WORDS: 482300,
    TOTAL_FOLDERS: 87,
  },
  summaries: {
    content_type: [
      { name: 'Topic', value: 1842 },
      { name: 'Map', value: 623 },
      { name: 'Image', value: 512 },
      { name: 'Resource', value: 338 },
      { name: 'Glossary', value: 87 },
    ],
  },
};

const meta: Meta<FolderInsightsDisplayComponent> = {
  title: 'Resource Drawer/Folder Insights Display',
  component: FolderInsightsDisplayComponent,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="max-width: 400px;">${story().template ?? ''}</div>`,
    }),
  ],
};

export default meta;
type Story = StoryObj<FolderInsightsDisplayComponent>;

/** Typical folder with files, words, and content type breakdown. */
export const Default: Story = {
  args: {
    data: sampleData,
  },
};

/** Small folder with few files and no content type breakdown. */
export const SmallFolder: Story = {
  args: {
    data: {
      callouts: {
        TOTAL_OBJECTS: 12,
        TOTAL_WORDS: 840,
      },
      summaries: {},
    },
  },
};

/** Large folder where compact formatting kicks in. */
export const LargeFolder: Story = {
  args: {
    data: {
      callouts: {
        TOTAL_OBJECTS: 14832,
        TOTAL_WORDS: 2_450_000,
        TOTAL_FOLDERS: 342,
      },
      summaries: {
        content_type: [
          { name: 'Topic', value: 8200 },
          { name: 'Map', value: 3100 },
          { name: 'Image', value: 2400 },
          { name: 'Resource', value: 800 },
          { name: 'Glossary', value: 332 },
        ],
      },
    },
  },
};

/** Folder with only callout data and no content type breakdown. */
export const CalloutsOnly: Story = {
  args: {
    data: {
      callouts: {
        TOTAL_OBJECTS: 500,
        TOTAL_WORDS: 25000,
        TOTAL_FOLDERS: 10,
      },
      summaries: {},
    },
  },
};

/** Empty state — no callout values and no summaries. */
export const Empty: Story = {
  args: {
    data: {
      callouts: {},
      summaries: {},
    },
  },
};
