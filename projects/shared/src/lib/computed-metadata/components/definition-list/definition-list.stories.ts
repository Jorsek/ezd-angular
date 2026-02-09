import type { Meta, StoryObj } from '@storybook/angular';
import { DefinitionListComponent } from './definition-list.component';
import { ComputedMetadataDefinition } from '../../models';

const mockDefinitions: ComputedMetadataDefinition[] = [
  {
    id: 1,
    name: 'Author',
    key: 'author',
    dataType: 'TEXT',
    multiValue: false,
    defaultValue: 'Unknown',
    xpaths: ['//prolog/author/text()', '//topicmeta/author/text()'],
    createdUtc: '2024-01-16T12:00:00Z',
    updatedUtc: '2024-01-16T12:00:00Z',
  },
  {
    id: 2,
    name: 'Document Title',
    key: 'document-title',
    dataType: 'TEXT',
    multiValue: false,
    defaultValue: null,
    xpaths: ['//title/text()'],
    createdUtc: '2024-01-16T12:00:00Z',
    updatedUtc: '2024-01-16T12:00:00Z',
  },
  {
    id: 3,
    name: 'Category',
    key: 'category',
    dataType: 'TEXT',
    multiValue: true,
    defaultValue: 'General',
    xpaths: [
      '//category/text()',
      '//metadata/category/text()',
      '//*[@class="topic/category"]/text()',
    ],
    createdUtc: '2024-01-15T10:00:00Z',
    updatedUtc: '2024-01-16T14:30:00Z',
  },
];

const meta: Meta<DefinitionListComponent> = {
  title: 'Extracted Metadata/Definition List',
  component: DefinitionListComponent,
  tags: ['autodocs'],
  argTypes: {
    edit: { action: 'edit' },
    deleteItem: { action: 'deleteItem' },
    recompute: { action: 'recompute' },
    reorder: { action: 'reorder' },
  },
};

export default meta;
type Story = StoryObj<DefinitionListComponent>;

export const Empty: Story = {
  args: {
    definitions: [],
  },
};

export const WithDefinitions: Story = {
  args: {
    definitions: mockDefinitions,
  },
};

export const SingleDefinition: Story = {
  args: {
    definitions: [mockDefinitions[0]],
  },
};
