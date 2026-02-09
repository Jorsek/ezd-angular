import type { Meta, StoryObj } from '@storybook/angular';
import { FolderPickerComponent } from './folder-picker';

const meta: Meta<FolderPickerComponent> = {
  title: 'Components/FolderPicker',
  component: FolderPickerComponent,
  tags: ['autodocs'],
  argTypes: {
    folderUuid: {
      control: 'text',
      description: 'UUID of the currently selected folder',
    },
    folderName: {
      control: 'text',
      description: 'Display name (path or filename) of the selected folder',
    },
    buttonText: {
      control: 'text',
      description: 'Label for the browse button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no folder is selected',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A folder picker component that displays a folder icon, folder name, and "Browse" button.

## Features

- **Folder Display**: Shows the selected folder path with a folder icon
- **Browse Button**: Launches the GWT folder picker dialog when clicked
- **Placeholder Support**: Displays placeholder text when no folder is selected
- **Disabled State**: Can be disabled to prevent interaction

## GWT Integration

This component communicates with the GWT folder picker via a window-level bridge:

\`\`\`typescript
// The GWT bridge is expected at:
window.ccmsFolderPicker = {
  open: (callbackId: string) => void
};

// GWT calls back via:
window.__ccmsFolderCallback_{callbackId}(uuid, name);
\`\`\`

## Usage

\`\`\`html
<ccms-folder-picker
  [folderUuid]="selectedFolderUuid"
  [folderName]="selectedFolderName"
  (folderChange)="onFolderChange($event)" />
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<FolderPickerComponent>;

export const Default: Story = {
  args: {
    folderUuid: '',
    folderName: '',
    buttonText: 'Browse',
    disabled: false,
    placeholder: 'No folder selected',
  },
  render: (args) => ({
    props: {
      ...args,
      onFolderChange: (event: { uuid: string; name: string }) => {
        console.log('Folder selected:', event);
      },
    },
    template: `
      <ccms-folder-picker
        [folderUuid]="folderUuid"
        [folderName]="folderName"
        [buttonText]="buttonText"
        [disabled]="disabled"
        [placeholder]="placeholder"
        (folderChange)="onFolderChange($event)" />
    `,
  }),
};

export const WithSelectedFolder: Story = {
  args: {
    folderUuid: '123e4567-e89b-12d3-a456-426614174000',
    folderName: '/content/docs/user-guide',
    buttonText: 'Browse',
    disabled: false,
    placeholder: 'No folder selected',
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-folder-picker
        [folderUuid]="folderUuid"
        [folderName]="folderName"
        [buttonText]="buttonText"
        [disabled]="disabled"
        [placeholder]="placeholder" />
    `,
  }),
};

export const CustomButtonText: Story = {
  args: {
    folderUuid: '',
    folderName: '',
    buttonText: 'Select Folder',
    disabled: false,
    placeholder: 'Choose a destination folder',
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-folder-picker
        [folderUuid]="folderUuid"
        [folderName]="folderName"
        [buttonText]="buttonText"
        [disabled]="disabled"
        [placeholder]="placeholder" />
    `,
  }),
};

export const Disabled: Story = {
  args: {
    folderUuid: '123e4567-e89b-12d3-a456-426614174000',
    folderName: '/content/docs/archived',
    buttonText: 'Browse',
    disabled: true,
    placeholder: 'No folder selected',
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-folder-picker
        [folderUuid]="folderUuid"
        [folderName]="folderName"
        [buttonText]="buttonText"
        [disabled]="disabled"
        [placeholder]="placeholder" />
    `,
  }),
};

export const LongFolderPath: Story = {
  args: {
    folderUuid: '123e4567-e89b-12d3-a456-426614174000',
    folderName: '/content/documentation/products/enterprise/user-guides/administration/security',
    buttonText: 'Browse',
    disabled: false,
    placeholder: 'No folder selected',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 400px;">
        <ccms-folder-picker
          [folderUuid]="folderUuid"
          [folderName]="folderName"
          [buttonText]="buttonText"
          [disabled]="disabled"
          [placeholder]="placeholder" />
      </div>
    `,
  }),
};
