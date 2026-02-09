import type { Meta, StoryObj } from '@storybook/angular';
import { FilterSectionComponent } from './filter-section';
import { FilterState } from '../../../models/filter.interface';

const meta: Meta<FilterSectionComponent> = {
  title: 'Components/FilterSection',
  component: FilterSectionComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The main filter section component that orchestrates all filter controls.

## Features

- **Default Filters**: Locale(s), L10N Status, File Status - always visible
- **Dynamic Filters**: Add additional filters via "+ Add" button
- **Lazy Loading**: Options are loaded when dropdowns are opened
- **Clear/Apply**: Clear all selections or apply filters

## Usage

\`\`\`html
<ccms-filter-section
  (filtersApplied)="onFiltersApplied($event)" />
\`\`\`

## Filter State Output

When filters change, emits a FilterState object:

\`\`\`typescript
{
  filters: {
    locale: ['de-DE', 'fr-FR'],
    localizedStatus: ['CURRENT'],
    fileStatus: [],  // Empty = "All"
    'metadata.category': ['marketing']
  }
}
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FilterSectionComponent>;

/**
 * Default filter section with all default filters.
 */
export const Default: Story = {
  render: () => ({
    props: {
      onFiltersApplied: (state: FilterState) => {
        console.log('Filters applied:', state);
      },
    },
    template: `
      <ccms-filter-section
        (filtersApplied)="onFiltersApplied($event)" />
    `,
  }),
};

/**
 * Interactive example - open console to see applied filters.
 */
export const Interactive: Story = {
  render: () => {
    const state = {
      appliedFilters: null as FilterState | null,
      onFiltersApplied(filterState: FilterState) {
        state.appliedFilters = filterState;
        console.log('Filters applied:', filterState);
      },
    };
    return {
      props: state,
      template: `
        <div>
          <ccms-filter-section
            (filtersApplied)="onFiltersApplied($event)" />

          @if (appliedFilters) {
            <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0;">Applied Filters:</h4>
              <pre style="margin: 0; font-size: 12px;">{{ appliedFilters | json }}</pre>
            </div>
          }
        </div>
      `,
    };
  },
};
