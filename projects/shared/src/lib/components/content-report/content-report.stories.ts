import type { Meta, StoryObj } from '@storybook/angular';
import { ContentReportComponent } from './content-report';

const meta: Meta<ContentReportComponent> = {
  title: 'Insights/Content',
  component: ContentReportComponent,
  tags: ['!autodocs'],
};

export default meta;
type Story = StoryObj<ContentReportComponent>;

export const MapContext: Story = {
  args: {
    contextUuid: 'fc0e8ea0-d601-11e2-aad0-001c42000009',
    contextType: 'map',
  },
};

export const FolderContext: Story = {
  args: {
    contextUuid: 'fb6c8240-d601-11e2-aad0-001c42000009',
    contextType: 'folder',
  },
};

export const BranchContext: Story = {
  args: {
    contextUuid: 'master',
    contextType: 'branch',
  },
};
