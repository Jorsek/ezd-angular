import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FolderInsightsComponent } from './folder-insights.component';
import { SkeletonComponent } from '@ccms/components/reporting/skeleton/skeleton';

const meta: Meta<FolderInsightsComponent> = {
  title: 'Resource Drawer/Folder Insights',
  component: FolderInsightsComponent,
  tags: ['!autodocs'],
};

export default meta;
type Story = StoryObj<FolderInsightsComponent>;

export const Default: Story = {
  args: {
    folderUuid: 'fb6c8240-d601-11e2-aad0-001c42000009',
  },
};

const rowStyle =
  'display: flex; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px solid #f0f0f0;';
const leftStyle = 'display: block; flex: 1;';
const rightStyle = 'display: block; flex-shrink: 0;';

/** Shows the skeleton loading state in isolation. */
export const Loading: Story = {
  decorators: [
    moduleMetadata({
      imports: [SkeletonComponent],
    }),
  ],
  render: () => ({
    template: `
      <div style="padding: 16px 0; display: flex; flex-direction: column;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px;">
          <ccms-skeleton variant="card" />
          <ccms-skeleton variant="card" />
        </div>
        <div style="padding-top: 16px; border-top: 1px solid #e0e0e0; display: flex; flex-direction: column;">
          <div style="${rowStyle}">
            <ccms-skeleton style="${leftStyle}" variant="text" />
            <ccms-skeleton style="${rightStyle}" variant="badge" width="48px" />
          </div>
          <div style="${rowStyle}">
            <ccms-skeleton style="${leftStyle}" variant="text" />
            <ccms-skeleton style="${rightStyle}" variant="badge" width="48px" />
          </div>
          <div style="${rowStyle}">
            <ccms-skeleton style="${leftStyle}" variant="text" />
            <ccms-skeleton style="${rightStyle}" variant="badge" width="48px" />
          </div>
          <div style="${rowStyle.replace('border-bottom: 1px solid #f0f0f0;', '')}">
            <ccms-skeleton style="${leftStyle}" variant="text" />
            <ccms-skeleton style="${rightStyle}" variant="badge" width="48px" />
          </div>
        </div>
      </div>
    `,
  }),
};
