import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { PopupMenuComponent } from './popup-menu';
import { PopupMenuTriggerDirective } from './popup-menu-trigger.directive';
import { PopupMenuItemComponent } from './popup-menu-item';
import { PopupSubmenuComponent } from './popup-submenu';

/**
 * Example consumer styles - in real usage these would be in your app's CSS.
 *
 * With the host-as-panel approach, consumers style using descendant selectors:
 * - ccms-popup-menu.my-class { ... } for the menu panel
 * - ccms-popup-menu.my-class ccms-popup-menu-item { ... } for items
 */
const consumerStyles = `
  /* Light theme panel */
  ccms-popup-menu.demo-menu {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 4px 0;
  }

  /* Light theme items */
  ccms-popup-menu.demo-menu ccms-popup-menu-item,
  ccms-popup-menu.demo-menu ccms-popup-submenu {
    color: #212121;
    font-size: 14px;
    padding: 8px 12px;
    align-items: center;
    gap: 8px;
  }

  ccms-popup-menu.demo-menu ccms-popup-menu-item:hover,
  ccms-popup-menu.demo-menu ccms-popup-submenu:hover {
    background: #f5f5f5;
  }

  ccms-popup-menu.demo-menu ccms-popup-menu-item:focus-visible,
  ccms-popup-menu.demo-menu ccms-popup-submenu:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: -2px;
  }

  ccms-popup-menu.demo-menu ccms-popup-menu-item.selected {
    background: #e3f2fd;
  }

  ccms-popup-menu.demo-menu ccms-popup-menu-item.selected::before {
    color: #1976d2;
  }

  ccms-popup-menu.demo-menu ccms-popup-menu-item.disabled {
    color: #9e9e9e;
  }

  ccms-popup-menu.demo-menu ccms-popup-submenu::after {
    border-left-color: #757575;
  }

  /* Submenu panel styling (uses .submenu-panel) */
  ccms-popup-menu.demo-menu .submenu-panel {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 4px 0;
  }

  /* Items inside submenu */
  ccms-popup-menu.demo-menu .submenu-panel ccms-popup-menu-item {
    color: #212121;
    font-size: 14px;
    padding: 8px 12px;
    align-items: center;
    gap: 8px;
  }

  ccms-popup-menu.demo-menu .submenu-panel ccms-popup-menu-item:hover {
    background: #f5f5f5;
  }

  /* Dark theme */
  ccms-popup-menu.dark-menu {
    background: #2d2d2d;
    border: 1px solid #404040;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    padding: 4px 0;
    border-radius: 8px;
  }

  ccms-popup-menu.dark-menu ccms-popup-menu-item,
  ccms-popup-menu.dark-menu ccms-popup-submenu {
    color: #e0e0e0;
    font-size: 14px;
    padding: 8px 12px;
    align-items: center;
    gap: 8px;
  }

  ccms-popup-menu.dark-menu ccms-popup-menu-item:hover,
  ccms-popup-menu.dark-menu ccms-popup-submenu:hover {
    background: #404040;
  }

  ccms-popup-menu.dark-menu ccms-popup-menu-item:focus-visible,
  ccms-popup-menu.dark-menu ccms-popup-submenu:focus-visible {
    outline: 2px solid #64b5f6;
    outline-offset: -2px;
  }

  ccms-popup-menu.dark-menu ccms-popup-menu-item.selected {
    background: #1e3a5f;
  }

  ccms-popup-menu.dark-menu ccms-popup-menu-item.selected::before {
    color: #64b5f6;
  }

  ccms-popup-menu.dark-menu ccms-popup-submenu::after {
    border-left-color: #9e9e9e;
  }

  ccms-popup-menu.dark-menu .submenu-panel {
    background: #2d2d2d;
    border: 1px solid #404040;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    padding: 4px 0;
    border-radius: 8px;
  }

  ccms-popup-menu.dark-menu .submenu-panel ccms-popup-menu-item {
    color: #e0e0e0;
    font-size: 14px;
    padding: 8px 12px;
    align-items: center;
    gap: 8px;
  }

  ccms-popup-menu.dark-menu .submenu-panel ccms-popup-menu-item:hover {
    background: #404040;
  }
`;

const meta: Meta<PopupMenuComponent> = {
  title: 'Components/PopupMenu',
  component: PopupMenuComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        PopupMenuComponent,
        PopupMenuTriggerDirective,
        PopupMenuItemComponent,
        PopupSubmenuComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
A structural popup menu component. The host element becomes the panel when open.

## Usage

\`\`\`html
<button [ccmsPopupMenuTrigger]="menu">Open</button>

<ccms-popup-menu #menu class="my-menu">
  <ccms-popup-menu-item (selected)="onEdit()">Edit</ccms-popup-menu-item>
  <ccms-popup-menu-item (selected)="onDelete()">Delete</ccms-popup-menu-item>
</ccms-popup-menu>
\`\`\`

## Styling

The component provides structural styles only. Style using descendant selectors from a class on the host:

\`\`\`css
/* Panel styling */
ccms-popup-menu.my-menu {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 4px 0;
}

/* Item styling */
ccms-popup-menu.my-menu ccms-popup-menu-item {
  color: #333;
  padding: 8px 12px;
}

ccms-popup-menu.my-menu ccms-popup-menu-item:hover {
  background: #f5f5f5;
}

ccms-popup-menu.my-menu ccms-popup-menu-item.selected {
  background: #e3f2fd;
}

ccms-popup-menu.my-menu ccms-popup-menu-item.disabled {
  color: #999;
}
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PopupMenuComponent>;

/**
 * Basic single-select menu with consumer-provided styles.
 */
export const SingleSelect: Story = {
  render: () => ({
    styles: [consumerStyles],
    template: `
      <button [ccmsPopupMenuTrigger]="actionsMenu" style="padding: 8px 16px; cursor: pointer;">
        Actions Menu
      </button>

      <ccms-popup-menu #actionsMenu class="demo-menu">
        <ccms-popup-menu-item (selected)="onEdit()">Edit</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onDuplicate()">Duplicate</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onDelete()">Delete</ccms-popup-menu-item>
      </ccms-popup-menu>
    `,
    props: {
      onEdit: () => console.log('Edit clicked'),
      onDuplicate: () => console.log('Duplicate clicked'),
      onDelete: () => console.log('Delete clicked'),
    },
  }),
};

/**
 * Multi-select menu with checkmarks for toggling options.
 */
export const MultiSelect: Story = {
  render: () => ({
    styles: [consumerStyles],
    template: `
      <button [ccmsPopupMenuTrigger]="filterMenu" style="padding: 8px 16px; cursor: pointer;">
        Filter Options
      </button>

      <ccms-popup-menu #filterMenu class="demo-menu" [multiSelect]="true" (selectionChange)="onSelectionChange($event)">
        <ccms-popup-menu-item value="active">Active</ccms-popup-menu-item>
        <ccms-popup-menu-item value="pending">Pending</ccms-popup-menu-item>
        <ccms-popup-menu-item value="completed">Completed</ccms-popup-menu-item>
        <ccms-popup-menu-item value="archived">Archived</ccms-popup-menu-item>
      </ccms-popup-menu>
    `,
    props: {
      onSelectionChange: (values: string[]) => console.log('Selected:', values),
    },
  }),
};

/**
 * Menu with some disabled items.
 */
export const WithDisabledItems: Story = {
  render: () => ({
    styles: [consumerStyles],
    template: `
      <button [ccmsPopupMenuTrigger]="menu" style="padding: 8px 16px; cursor: pointer;">
        File Menu
      </button>

      <ccms-popup-menu #menu class="demo-menu">
        <ccms-popup-menu-item (selected)="onNew()">New</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onOpen()">Open</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onSave()">Save</ccms-popup-menu-item>
        <ccms-popup-menu-item [disabled]="true">Save As... (disabled)</ccms-popup-menu-item>
        <ccms-popup-menu-item [disabled]="true">Export (disabled)</ccms-popup-menu-item>
      </ccms-popup-menu>
    `,
    props: {
      onNew: () => console.log('New clicked'),
      onOpen: () => console.log('Open clicked'),
      onSave: () => console.log('Save clicked'),
    },
  }),
};

/**
 * Menu with nested submenus.
 */
export const WithSubmenus: Story = {
  render: () => ({
    styles: [consumerStyles],
    template: `
      <button [ccmsPopupMenuTrigger]="menu" style="padding: 8px 16px; cursor: pointer;">
        File Menu
      </button>

      <ccms-popup-menu #menu class="demo-menu">
        <ccms-popup-menu-item (selected)="onClick('new')">New</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onClick('open')">Open</ccms-popup-menu-item>
        <ccms-popup-menu-item (selected)="onClick('save')">Save</ccms-popup-menu-item>
        <ccms-popup-submenu label="Export">
          <ccms-popup-menu-item (selected)="onClick('pdf')">PDF</ccms-popup-menu-item>
          <ccms-popup-menu-item (selected)="onClick('word')">Word Document</ccms-popup-menu-item>
          <ccms-popup-menu-item (selected)="onClick('html')">HTML</ccms-popup-menu-item>
        </ccms-popup-submenu>
        <ccms-popup-submenu label="Share">
          <ccms-popup-menu-item (selected)="onClick('email')">Email</ccms-popup-menu-item>
          <ccms-popup-menu-item (selected)="onClick('link')">Copy Link</ccms-popup-menu-item>
        </ccms-popup-submenu>
        <ccms-popup-menu-item (selected)="onClick('delete')">Delete</ccms-popup-menu-item>
      </ccms-popup-menu>
    `,
    props: {
      onClick: (action: string) => console.log('Action:', action),
    },
  }),
};

/**
 * Dark theme example showing how consumers can completely restyle the menu.
 */
export const DarkTheme: Story = {
  render: () => ({
    styles: [consumerStyles],
    template: `
      <div style="padding: 20px; background: #1a1a1a; display: inline-block;">
        <button [ccmsPopupMenuTrigger]="menu" style="padding: 8px 16px; cursor: pointer; background: #404040; color: #e0e0e0; border: 1px solid #555; border-radius: 4px;">
          Dark Menu
        </button>

        <ccms-popup-menu #menu class="dark-menu">
          <ccms-popup-menu-item (selected)="onClick('new')">New Document</ccms-popup-menu-item>
          <ccms-popup-menu-item (selected)="onClick('open')">Open</ccms-popup-menu-item>
          <ccms-popup-menu-item (selected)="onClick('save')">Save</ccms-popup-menu-item>
          <ccms-popup-submenu label="Export">
            <ccms-popup-menu-item (selected)="onClick('pdf')">PDF</ccms-popup-menu-item>
            <ccms-popup-menu-item (selected)="onClick('word')">Word</ccms-popup-menu-item>
          </ccms-popup-submenu>
          <ccms-popup-menu-item [disabled]="true">Print (disabled)</ccms-popup-menu-item>
        </ccms-popup-menu>
      </div>
    `,
    props: {
      onClick: (action: string) => console.log('Action:', action),
    },
  }),
};
