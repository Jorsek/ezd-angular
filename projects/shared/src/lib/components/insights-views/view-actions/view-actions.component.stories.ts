import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ViewActionsComponent } from './view-actions.component';
import { InsightsView } from '../insights-views.models';

const sampleView: InsightsView = {
  id: 'sample-view-id',
  name: 'All Resources',
  description: 'Shows all localized resources',
  insightType: 'LOCALIZATION',
  shared: false,
  callouts: [],
  columns: [],
  filters: [],
  sorts: [],
  charts: [],
};

const meta: Meta<ViewActionsComponent> = {
  title: 'Insights Views/ViewActions',
  component: ViewActionsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ViewActionsComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Action buttons for managing insight views.

## Usage

\`\`\`html
<ccms-view-actions
  [view]="selectedView"
  [dirty]="hasUnsavedChanges"
  [editable]="isViewEditable"
  [showCreateButton]="allowUserViews"
  (updateView)="onUpdate($event)"
  (createView)="onCreate()"
/>
\`\`\`

## States

- **Loading**: Shows a skeleton button placeholder
- **No view selected**: Shows only "Save as new View" button (if allowed)
- **View selected (clean)**: Shows only "Save as new View" button (if allowed)
- **View selected (dirty & editable)**: Shows "Save Changes" and "Save as new View" buttons
- **View selected (dirty but not editable)**: Shows only "Save as new View" button (if allowed)
        `,
      },
    },
  },
  argTypes: {
    updateView: { action: 'updateView' },
    createView: { action: 'createView' },
    copyView: { action: 'copyView' },
  },
};

export default meta;
type Story = StoryObj<ViewActionsComponent>;

/**
 * Loading state - shows a skeleton button placeholder.
 */
export const Loading: Story = {
  args: {
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays a skeleton placeholder while data is loading.',
      },
    },
  },
};

/**
 * No view selected - shows only a "Save as new View" button.
 */
export const NoView: Story = {
  args: {
    view: null,
    dirty: false,
    editable: true,
    showCreateButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no view is selected, only the "Save as new View" button is shown.',
      },
    },
  },
};

/**
 * View selected but no changes - only "Save as new View" is shown.
 */
export const ViewSelectedClean: Story = {
  args: {
    view: sampleView,
    dirty: false,
    editable: true,
    showCreateButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a view is selected but there are no unsaved changes, only the "Save as new View" button is shown.',
      },
    },
  },
};

/**
 * View selected with unsaved changes - both buttons are shown.
 */
export const ViewSelectedDirty: Story = {
  args: {
    view: sampleView,
    dirty: true,
    editable: true,
    showCreateButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a view is selected and there are unsaved changes, both "Save Changes" and "Save as new View" buttons are shown.',
      },
    },
  },
};

/**
 * View selected, dirty, but not editable - only "Save as new View" is shown.
 */
export const ViewSelectedDirtyNotEditable: Story = {
  args: {
    view: { ...sampleView, readOnly: true },
    dirty: true,
    editable: false,
    showCreateButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a read-only view is modified, only the "Save as new View" button is shown since the original cannot be updated.',
      },
    },
  },
};

/**
 * User views disabled - no "Save as new View" button.
 */
export const UserViewsDisabled: Story = {
  args: {
    view: sampleView,
    dirty: true,
    editable: true,
    showCreateButton: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When user views are disabled, only the "Save Changes" button is shown for editable views.',
      },
    },
  },
};
