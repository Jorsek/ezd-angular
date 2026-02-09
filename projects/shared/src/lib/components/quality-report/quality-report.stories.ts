import type { Meta, StoryObj } from '@storybook/angular';
import { QualityReportComponent } from './quality-report';

const meta: Meta<QualityReportComponent> = {
  title: 'Insights/Quality',
  component: QualityReportComponent,
  tags: ['autodocs'],
  argTypes: {
    contextUuid: {
      control: 'text',
      description: 'UUID of the file to display insights for',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Quality Report Component',
      },
    },
  },
};

export default meta;
type Story = StoryObj<QualityReportComponent>;

/**
 * Default story showing the component as it appears when embedded.
 * The component will attempt to fetch real data from the API endpoint.
 */
export const Default: Story = {
  args: {
    contextUuid: 'fb7d7230-d601-11e2-aad0-001c42000009',
  },
};

export const NoScans: Story = {
  args: {
    contextUuid: '00719aa0-d602-11e2-aad0-001c42000009',
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates how the report is rendered if there are no scans
        `,
      },
    },
  },
  render: () => ({
    template: `
      <div style="width: 100vw; height: 100vh;">
        <ccms-quality-report></ccms-quality-report>
      </div>
    `,
  }),
};

/**
 * Story showing the component in isolation.
 * Note: Requires the ezd backend running at localhost:8080 for the API call to succeed.
 */
export const WithLiveData: Story = {
  args: {
    contextUuid: 'fb7d7230-d601-11e2-aad0-001c42000009',
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the component making a real API call.
The ezd backend must be running at \`localhost:8080\` for this to work.

If the backend is not running, you'll see a loading state or error in the browser console.
        `,
      },
    },
  },
};
