import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxGroupComponent } from './checkbox-group';

const meta: Meta<CheckboxGroupComponent<string>> = {
  title: 'Components/Checkbox Group',
  component: CheckboxGroupComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<CheckboxGroupComponent<string>>;

export const Default: Story = {
  args: {
    title: 'Checkbox Group Title',
    options: [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 2', value: '2' },
    ],
  },
};
