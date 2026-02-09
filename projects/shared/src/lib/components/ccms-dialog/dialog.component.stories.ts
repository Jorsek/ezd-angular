import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { DialogButton, DialogComponent } from './dialog.component';

@Component({
  selector: 'ccms-dialog-story-wrapper',
  template: `
    <ccms-dialog
      [title]="title"
      [description]="description"
      [buttons]="buttons"
      (escapePressed)="onEscape()"
    >
      <p>This is the dialog content. It can contain any elements.</p>
    </ccms-dialog>
    <p style="margin-top: 16px; color: #666; font-size: 12px;">Last action: {{ lastAction() }}</p>
  `,
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogStoryWrapperComponent {
  title = 'Dialog Title';
  description = 'Optional description text goes here.';
  lastAction = signal('None');

  buttons: DialogButton[] = [
    { label: 'Cancel', type: 'default', onClick: () => this.lastAction.set('Cancel clicked') },
    { label: 'Save', type: 'action', onClick: () => this.lastAction.set('Save clicked') },
  ];

  onEscape(): void {
    this.lastAction.set('Escape pressed');
  }
}

@Component({
  selector: 'ccms-dialog-delete-story-wrapper',
  template: `
    <ccms-dialog
      [title]="title()"
      [description]="description()"
      [buttons]="buttons()"
      (escapePressed)="onEscape()"
    >
      @if (mode() === 'edit') {
        <p>Edit your item here.</p>
        <input type="text" value="My Item" style="width: 100%; padding: 8px; margin-top: 8px;" />
      } @else {
        <p>Are you sure you want to delete "My Item"? This cannot be undone.</p>
      }
    </ccms-dialog>
    <p style="margin-top: 16px; color: #666; font-size: 12px;">
      Mode: {{ mode() }} | Last action: {{ lastAction() }}
    </p>
  `,
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogDeleteFlowWrapperComponent {
  mode = signal<'edit' | 'confirm-delete'>('edit');
  lastAction = signal('None');

  title = signal('Edit Item');
  description = signal('Make changes to your item.');

  buttons = signal<DialogButton[]>([
    { label: 'Delete', type: 'danger', onClick: () => this.onDelete() },
    { label: 'Cancel', type: 'default', onClick: () => this.lastAction.set('Cancel clicked') },
    { label: 'Save', type: 'action', onClick: () => this.lastAction.set('Save clicked') },
  ]);

  onDelete(): void {
    this.mode.set('confirm-delete');
    this.title.set('Delete Item?');
    this.description.set('This action cannot be undone.');
    this.buttons.set([
      { label: 'Cancel', type: 'default', onClick: () => this.onCancelDelete() },
      { label: 'Confirm Delete', type: 'danger', onClick: () => this.onConfirmDelete() },
    ]);
  }

  onCancelDelete(): void {
    this.mode.set('edit');
    this.title.set('Edit Item');
    this.description.set('Make changes to your item.');
    this.buttons.set([
      { label: 'Delete', type: 'danger', onClick: () => this.onDelete() },
      { label: 'Cancel', type: 'default', onClick: () => this.lastAction.set('Cancel clicked') },
      { label: 'Save', type: 'action', onClick: () => this.lastAction.set('Save clicked') },
    ]);
  }

  onConfirmDelete(): void {
    this.lastAction.set('Item deleted!');
  }

  onEscape(): void {
    if (this.mode() === 'confirm-delete') {
      this.onCancelDelete();
    } else {
      this.lastAction.set('Escape pressed - dialog closed');
    }
  }
}

const meta: Meta<DialogComponent> = {
  title: 'Components/Dialog',
  component: DialogComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [DialogComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
A reusable dialog component with title, description, content, and action buttons.

## Features
- **Keyboard navigation**: Enter executes the action button, Escape emits \`escapePressed\`
- **Button types**: \`default\`, \`action\` (primary), \`danger\` (destructive)
- **Content projection**: Any content can be placed inside the dialog

## Usage

\`\`\`html
<ccms-dialog
  [title]="'Save Changes'"
  [description]="'Review your changes before saving.'"
  [buttons]="buttons"
  (escapePressed)="onCancel()"
>
  <p>Your content here</p>
</ccms-dialog>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DialogComponent>;

export const Default: Story = {
  render: () => ({
    template: `<ccms-dialog-story-wrapper />`,
    moduleMetadata: {
      imports: [DialogStoryWrapperComponent],
    },
  }),
};

export const WithDeleteFlow: Story = {
  render: () => ({
    template: `<ccms-dialog-delete-story-wrapper />`,
    moduleMetadata: {
      imports: [DialogDeleteFlowWrapperComponent],
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates a dialog that transitions from edit mode to delete confirmation mode.',
      },
    },
  },
};

export const NoDescription: Story = {
  args: {
    title: 'Simple Dialog',
    buttons: [{ label: 'Close', type: 'default', onClick: () => {} }],
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-dialog [title]="title" [buttons]="buttons">
        <p>A dialog without a description.</p>
      </ccms-dialog>
    `,
  }),
};

export const DangerOnly: Story = {
  args: {
    title: 'Delete Confirmation',
    description: 'This action cannot be undone.',
    buttons: [
      { label: 'Cancel', type: 'default', onClick: () => {} },
      { label: 'Delete', type: 'danger', onClick: () => {} },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-dialog [title]="title" [description]="description" [buttons]="buttons">
        <p>Are you sure you want to delete this item?</p>
      </ccms-dialog>
    `,
  }),
};

export const WithCloseButton: Story = {
  args: {
    title: 'Edit View',
    showCloseButton: true,
    buttons: [
      { label: 'Delete View', type: 'danger', onClick: () => {} },
      { label: 'Cancel', type: 'default', onClick: () => {} },
      { label: 'Save Changes', type: 'action', onClick: () => {} },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-dialog [title]="title" [showCloseButton]="showCloseButton" [buttons]="buttons">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <label style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 14px; font-weight: 500;">View Name</span>
            <input type="text" value="My Custom View" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </label>
        </div>
      </ccms-dialog>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Dialog with a close button in the header and danger button on the left side of the footer.',
      },
    },
  },
};

export const DeleteConfirmation: Story = {
  args: {
    title: 'Edit View',
    showCloseButton: true,
    buttons: [
      { label: 'Cancel', type: 'default', onClick: () => {} },
      { label: 'Delete View', type: 'danger-action', onClick: () => {} },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <ccms-dialog [title]="title" [showCloseButton]="showCloseButton" [buttons]="buttons">
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #374151;">
          Are you sure you want to delete the view "<strong>Content Freshness</strong>"? This action cannot be undone.
        </p>
      </ccms-dialog>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Delete confirmation dialog with a filled red danger-action button.',
      },
    },
  },
};
