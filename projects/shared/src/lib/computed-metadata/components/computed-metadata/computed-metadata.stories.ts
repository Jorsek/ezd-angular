import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { ComputedMetadataComponent } from './computed-metadata.component';

const meta: Meta<ComputedMetadataComponent> = {
  title: 'Extracted Metadata/Extracted Metadata',
  component: ComputedMetadataComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ComputedMetadataComponent>;

/**
 * The main extracted metadata component.
 *
 * **Note:** This component requires the turbo-dita backend to be running
 * for the API calls to work. In Storybook, you'll see loading/error states
 * unless the backend is available.
 *
 * Features:
 * - List all extracted metadata definitions
 * - Create new definitions with XPath expressions
 * - Edit existing definitions
 * - Preview computed values (SSE stream)
 * - Recompute all values with progress (SSE stream)
 * - Delete definitions
 */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="height: 600px; padding: 20px; background: #f0f0f0;">
        <ccms-computed-metadata />
      </div>
    `,
  }),
};

/**
 * The component in a narrower container, like a sidebar panel.
 */
export const NarrowContainer: Story = {
  render: () => ({
    template: `
      <div style="width: 400px; height: 500px; padding: 20px; background: #f0f0f0;">
        <ccms-computed-metadata />
      </div>
    `,
  }),
};
