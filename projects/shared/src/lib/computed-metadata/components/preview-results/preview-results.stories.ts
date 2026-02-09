import type { Meta, StoryObj } from '@storybook/angular';
import { PreviewResultsComponent } from './preview-results.component';
import { PreviewItem } from '../../models';

const mockItems: PreviewItem[] = [
  {
    filename: 'getting-started.dita',
    ditaType: 'TOPIC',
    value: 'John Doe',
    matchedXpath: '//prolog/author/text()',
  },
  {
    filename: 'user-guide.ditamap',
    ditaType: 'MAP',
    value: 'Jane Smith',
    matchedXpath: '//topicmeta/author/text()',
  },
  {
    filename: 'installation.dita',
    ditaType: 'TOPIC',
    value: 'Unknown',
    matchedXpath: null,
  },
  {
    filename: 'configuration.dita',
    ditaType: 'TOPIC',
    value: 'Bob Wilson',
    matchedXpath: '//*[contains(@class, "topic/author")]/text()',
  },
  {
    filename: 'troubleshooting.dita',
    ditaType: 'TOPIC',
    value: 'Unknown',
    matchedXpath: null,
  },
  {
    filename: 'api-reference.ditamap',
    ditaType: 'MAP',
    value: 'API Team',
    matchedXpath: '//topicmeta/author/text()',
  },
];

const meta: Meta<PreviewResultsComponent> = {
  title: 'Extracted Metadata/Preview Results',
  component: PreviewResultsComponent,
  tags: ['autodocs'],
  argTypes: {
    closePanel: { action: 'closePanel' },
  },
};

export default meta;
type Story = StoryObj<PreviewResultsComponent>;

export const Empty: Story = {
  args: {
    items: [],
    isLoading: false,
    error: null,
    recomputeProgress: null,
  },
};

export const Loading: Story = {
  args: {
    items: [],
    isLoading: true,
    error: null,
    recomputeProgress: null,
  },
};

export const WithResults: Story = {
  args: {
    items: mockItems,
    isLoading: false,
    error: null,
    recomputeProgress: null,
  },
};

export const LoadingMore: Story = {
  args: {
    items: mockItems.slice(0, 3),
    isLoading: true,
    error: null,
    recomputeProgress: null,
  },
};

export const WithError: Story = {
  args: {
    items: [],
    isLoading: false,
    error: 'Failed to load preview: Connection timeout',
    recomputeProgress: null,
  },
};

export const RecomputeInProgress: Story = {
  args: {
    items: [],
    isLoading: false,
    error: null,
    recomputeProgress: {
      type: 'progress',
      current: 42,
      total: 100,
    },
  },
};

export const RecomputeComplete: Story = {
  args: {
    items: [],
    isLoading: false,
    error: null,
    recomputeProgress: {
      type: 'complete',
      current: 100,
      total: 100,
      failed: 3,
    },
  },
};
