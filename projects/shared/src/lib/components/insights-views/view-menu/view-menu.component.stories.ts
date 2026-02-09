import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ViewMenuComponent, ViewDescription } from './view-menu.component';

const sampleViews: ViewDescription[] = [
  { id: '1', name: 'All Resources', description: 'Shows all localized resources' },
  { id: '2', name: 'Needs Translation', description: 'Resources missing translations' },
  { id: '3', name: 'Outdated', description: 'Resources with outdated translations' },
  { id: '4', name: 'In Progress', description: 'Resources currently being translated' },
];

const meta: Meta<ViewMenuComponent> = {
  title: 'Insights Views/ViewMenu',
  component: ViewMenuComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ViewMenuComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
A dropdown menu for selecting saved views in the Insights feature.

## Usage

\`\`\`html
<ccms-view-menu
  [items]="views"
  [loading]="isLoading"
  (viewChanged)="onViewChange($event)"
/>
\`\`\`

## States

- **Loading**: Shows a shimmer skeleton while views are being fetched
- **Loaded**: Shows a dropdown trigger with the selected view name
- **Empty**: Shows "No views available" message in the dropdown
        `,
      },
    },
  },
  argTypes: {
    viewChanged: { action: 'viewChanged' },
    deleteView: { action: 'deleteView' },
    editView: { action: 'editView' },
  },
};

export default meta;
type Story = StoryObj<ViewMenuComponent>;

/**
 * Loading state - shows a shimmer skeleton while views are being fetched.
 */
export const Loading: Story = {
  args: {
    items: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays a loading skeleton while waiting for views to load.',
      },
    },
  },
};

/**
 * Loaded with items - shows the dropdown with available views.
 */
export const WithItems: Story = {
  args: {
    items: sampleViews,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays the dropdown trigger. Click to see available views.',
      },
    },
  },
};

/**
 * With a pre-selected view via input.
 */
export const WithSelectedView: Story = {
  args: {
    items: sampleViews,
    loading: false,
    selected: sampleViews[1],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a view is pre-selected via the `selected` input, its name appears in the trigger button.',
      },
    },
  },
};

/**
 * Empty state - no views available.
 */
export const NoViews: Story = {
  args: {
    items: [],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When there are no views, the dropdown shows "No views available".',
      },
    },
  },
};
