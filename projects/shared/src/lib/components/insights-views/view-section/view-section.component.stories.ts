import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { PopupOutletComponent, PopupService } from '../../ccms-popup';
import { CurrentViewService } from '../current-view.service';
import { InsightsType, InsightsView } from '../insights-views.models';
import { ViewsService } from '../views.service';
import { ViewSectionComponent } from './view-section.component';

const sampleViews: InsightsView[] = [
  {
    id: 'default-view-id',
    insightType: 'CONTENT',
    name: 'Default View',
    description: 'The default view showing all resources',
    shared: true,
    readOnly: true,
    callouts: [],
    charts: [],
    columns: [],
    filters: [],
    sorts: [],
  },
  {
    id: 'view-1',
    insightType: 'CONTENT',
    name: 'Needs Translation',
    description: 'Resources missing translations',
    shared: false,
    callouts: [],
    charts: [],
    columns: [],
    filters: [],
    sorts: [],
  },
  {
    id: 'view-2',
    insightType: 'CONTENT',
    name: 'Outdated',
    description: 'Resources with outdated translations',
    shared: false,
    callouts: [],
    charts: [],
    columns: [],
    filters: [],
    sorts: [],
  },
];

const mockViewsService = {
  get: () => of(sampleViews),
  update: (viewType: string, view: InsightsView) => of(view),
};

@Component({
  selector: 'ccms-view-section-story-wrapper',
  template: `
    <ccms-view-section
      [views]="views()"
      [insightType]="insightType()"
      [allowUserViews]="allowUserViews()"
      (saveView)="onSaveView($event)"
      (updateView)="onUpdateView($event)"
      (deleteView)="onDeleteView($event)"
    />
    <ccms-popup-outlet />
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      min-height: 400px;
    }
  `,
  imports: [ViewSectionComponent, PopupOutletComponent],
  providers: [PopupService, CurrentViewService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ViewSectionStoryWrapperComponent {
  views = input.required<InsightsView[]>();
  insightType = input.required<InsightsType>();
  allowUserViews = input<boolean>(true);

  onSaveView(request: unknown): void {
    console.log('Save view requested:', request);
  }

  onUpdateView(request: unknown): void {
    console.log('Update view requested:', request);
  }

  onDeleteView(id: string): void {
    console.log('Delete view requested:', id);
  }
}

const meta: Meta<ViewSectionStoryWrapperComponent> = {
  title: 'Insights Views/ViewSection',
  component: ViewSectionStoryWrapperComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ViewSectionStoryWrapperComponent],
    }),
    applicationConfig({
      providers: [{ provide: ViewsService, useValue: mockViewsService }],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
A container component that combines the view menu and view actions for managing saved views.

## Usage

The view section now takes views and insightType as inputs:

\`\`\`typescript
@Component({
  providers: [CurrentViewService],
})
export class ParentComponent {
  views = signal<InsightsView[]>([]);
}
\`\`\`

\`\`\`html
<ccms-view-section
  [views]="allViews()"
  [insightType]="'CONTENT'"
  [allowUserViews]="true"
  (saveView)="onSaveView($event)"
  (updateView)="onUpdateView($event)"
  (deleteView)="onDeleteView($event)"
/>
\`\`\`

## Inputs

- **views**: Array of InsightsView objects (first one is the default)
- **insightType**: The type of insight ('CONTENT', 'LOCALIZATION', etc.)
- **allowUserViews**: Whether to allow creating/managing user views (shows "Save as new View" button)
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ViewSectionStoryWrapperComponent>;

export const Default: Story = {
  args: {
    views: sampleViews,
    insightType: 'CONTENT',
    allowUserViews: true,
  },
};

export const SingleViewWithUserViews: Story = {
  args: {
    views: [sampleViews[0]],
    insightType: 'CONTENT',
    allowUserViews: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single view with allowUserViews enabled - view section is visible.',
      },
    },
  },
};

export const SingleViewNoUserViews: Story = {
  args: {
    views: [sampleViews[0]],
    insightType: 'CONTENT',
    allowUserViews: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single view with allowUserViews disabled - view section is hidden.',
      },
    },
  },
};

export const NoUserViews: Story = {
  args: {
    views: sampleViews,
    insightType: 'CONTENT',
    allowUserViews: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple views but user views disabled - "Save as new View" button is hidden.',
      },
    },
  },
};
