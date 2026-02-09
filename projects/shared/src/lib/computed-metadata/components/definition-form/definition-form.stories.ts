import type { Meta, StoryObj } from '@storybook/angular';
import { DefinitionFormComponent } from './definition-form.component';
import { ComputedMetadataDefinition } from '../../models';

const mockDefinition: ComputedMetadataDefinition = {
  id: 1,
  name: 'Author',
  key: 'author',
  dataType: 'TEXT',
  multiValue: false,
  defaultValue: 'Unknown',
  xpaths: ['//prolog/author/text()', '//topicmeta/author/text()'],
  createdUtc: '2024-01-16T12:00:00Z',
  updatedUtc: '2024-01-16T12:00:00Z',
};

const meta: Meta<DefinitionFormComponent> = {
  title: 'Extracted Metadata/Definition Form',
  component: DefinitionFormComponent,
  tags: ['autodocs'],
  argTypes: {
    save: { action: 'save' },
    formCancel: { action: 'formCancel' },
  },
  decorators: [
    (story) => ({
      ...story(),
      styles: ['ccms-definition-form { display: block; height: 600px; }'],
    }),
  ],
};

export default meta;
type Story = StoryObj<DefinitionFormComponent>;

export const CreateMode: Story = {
  args: {
    definition: null,
    isSubmitting: false,
  },
};

export const EditMode: Story = {
  args: {
    definition: mockDefinition,
    isSubmitting: false,
  },
};

export const Submitting: Story = {
  args: {
    definition: mockDefinition,
    isSubmitting: true,
  },
};

export const EditWithManyXpaths: Story = {
  args: {
    definition: {
      ...mockDefinition,
      xpaths: [
        '//prolog/author/text()',
        '//topicmeta/author/text()',
        '//*[contains(@class, "topic/author")]/text()',
        '//creator/text()',
      ],
    },
    isSubmitting: false,
  },
};
