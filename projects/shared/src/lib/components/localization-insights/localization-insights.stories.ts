import type { Meta, StoryObj } from '@storybook/angular';
import { LocalizationInsightsComponent } from './localization-insights';

const meta: Meta<LocalizationInsightsComponent> = {
  title: 'Insights/Localization',
  component: LocalizationInsightsComponent,
  tags: ['!autodocs'],
};

export default meta;
type Story = StoryObj<LocalizationInsightsComponent>;

export const Global: Story = {};

export const MapContext: Story = {
  args: {
    contextUuid: 'fc0e8ea0-d601-11e2-aad0-001c42000009',
    contextType: 'map',
    showHeader: false,
  },
};

export const FolderContext: Story = {
  args: {
    contextUuid: 'fb6c8240-d601-11e2-aad0-001c42000009',
    contextType: 'folder',
    showHeader: false,
  },
};

export const BranchContext: Story = {
  args: {
    contextUuid: 'master',
    contextType: 'branch',
    showHeader: false,
  },
};
