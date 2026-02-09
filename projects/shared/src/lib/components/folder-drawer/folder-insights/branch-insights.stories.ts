import { Meta, StoryObj } from '@storybook/angular';
import { FolderInsightsComponent } from './folder-insights.component';

const meta: Meta<FolderInsightsComponent> = {
  title: 'Resource Drawer/Branch Insights',
  component: FolderInsightsComponent,
  tags: ['!autodocs'],
};

export default meta;
type Story = StoryObj<FolderInsightsComponent>;

export const Default: Story = {
  args: {
    branchName: 'master',
  },
};
