import type { Meta, StoryObj } from '@storybook/angular';
import { CalloutSectionComponent } from './callout-section';
import { CalloutConfig } from './callout-config.interface';

const MOCK_CALLOUTS: Record<string, number> = {
  TOPIC_REUSE_SAVINGS_PCT: 34,
  UNIQUE_TOPICS: 3482,
  TOTAL_TOPIC_USAGE: 5273,
  AVG_PUBS_PER_TOPIC: 1.51,
  TOPICS_REUSED: 1847,
  TEXT_REUSE_SAVINGS_PCT: 28,
  UNIQUE_WORDS: 245800,
  TOTAL_WORDS_REFERENCED: 341700,
  AVG_REUSE_MULTIPLIER: 1.39,
  WORDS_REUSED: 198400,
};

const TOPIC_HIGHLIGHTED: CalloutConfig = {
  id: 'TOPIC_REUSE_SAVINGS_PCT',
  label: 'Reuse Savings',
  suffix: '%',
  info: 'Percentage of content duplication avoided through topic reuse',
};

const TOPIC_ITEMS: CalloutConfig[] = [
  {
    id: 'UNIQUE_TOPICS',
    label: 'Unique Topics Managed',
    info: 'Distinct topics across all publications',
  },
  { id: 'TOTAL_TOPIC_USAGE', label: 'Total Topic Usage' },
  { id: 'AVG_PUBS_PER_TOPIC', label: 'Avg. Publications per Topic' },
  { id: 'TOPICS_REUSED', label: 'Topics Reused at Least Once' },
];

const meta: Meta<CalloutSectionComponent> = {
  title: 'Reporting/CalloutSection',
  component: CalloutSectionComponent,
};

export default meta;
type Story = StoryObj<CalloutSectionComponent>;

export const Default: Story = {
  args: {
    title: 'Topic Reuse',
    summaryText: 'How many times topics are reused across publications',
    icon: '📊',
    loading: false,
    callouts: MOCK_CALLOUTS,
    highlighted: TOPIC_HIGHLIGHTED,
    items: TOPIC_ITEMS,
  },
};

export const WithCompactNumbers: Story = {
  args: {
    title: 'Topic Reuse',
    summaryText: 'How many times topics are reused across publications',
    icon: '📊',
    loading: false,
    callouts: MOCK_CALLOUTS,
    highlighted: TOPIC_HIGHLIGHTED,
    items: TOPIC_ITEMS,
    compact: true,
  },
};

export const Loading: Story = {
  args: {
    title: 'Topic Reuse',
    summaryText: 'How many times topics are reused across publications',
    icon: '📊',
    loading: true,
    callouts: {},
    highlighted: TOPIC_HIGHLIGHTED,
    items: TOPIC_ITEMS,
  },
};

export const NoData: Story = {
  args: {
    title: 'Topic Reuse',
    summaryText: 'How many times topics are reused across publications',
    icon: '📊',
    loading: false,
    callouts: {},
    highlighted: TOPIC_HIGHLIGHTED,
    items: TOPIC_ITEMS,
  },
};

export const NoHighlighted: Story = {
  args: {
    title: 'Metrics Overview',
    loading: false,
    callouts: MOCK_CALLOUTS,
    highlighted: null,
    items: TOPIC_ITEMS,
  },
};

export const NoHeader: Story = {
  args: {
    loading: false,
    callouts: MOCK_CALLOUTS,
    highlighted: TOPIC_HIGHLIGHTED,
    items: TOPIC_ITEMS,
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Simple Section',
    loading: false,
    callouts: MOCK_CALLOUTS,
    highlighted: TOPIC_HIGHLIGHTED,
    items: TOPIC_ITEMS,
  },
};
