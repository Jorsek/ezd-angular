import type { Meta, StoryObj } from '@storybook/angular';
import { ResourceChipComponent } from './resource-chip';

const meta: Meta<ResourceChipComponent> = {
  title: 'Components/ResourceChip',
  component: ResourceChipComponent,
  tags: ['autodocs'],
  argTypes: {
    resource: {
      control: 'object',
      description: 'The resource file data containing fileName and metadata (full object mode)',
    },
    filename: {
      control: 'text',
      description: 'Filename for lightweight mode',
    },
    ditaType: {
      control: 'select',
      options: ['NON_DITA', 'MAP', 'TOPIC'],
      description: 'DITA type for lightweight mode',
    },
    ezdPath: {
      control: 'text',
      description: 'easyDITA path for tooltip display',
    },
    title: {
      control: 'text',
      description: 'Display title (shown above filename in full mode)',
    },
    shareUrl: {
      control: 'text',
      description: 'Direct share URL (makes chip clickable)',
    },
    mode: {
      control: 'select',
      options: ['compact', 'full'],
      description: 'Display mode: compact (inline) or full (with title row)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A resource chip component for displaying DITA resource files with visual indicators.

## Features

- **Visual Indicators**: Font icons identify file types at a glance
  - 🟢 Green map icon for \`.ditamap\` files
  - 🔵 Blue topic icon for \`.dita\` files
- **Two Display Modes**:
  - \`compact\` (default): Icon + filename inline
  - \`full\`: Icon aligned with title, filename below
- **Clickable**: When \`resource\`, \`shareUrl\`, or \`resourceUuid\` is provided
- **Tooltip Support**: Hover to see the ezdPath or resource title

## Usage

\`\`\`html
<!-- Compact mode (default) -->
<ccms-resource-chip [resource]="myResource" />

<!-- Full mode with title -->
<ccms-resource-chip
  mode="full"
  [title]="item.title"
  [filename]="item.filename"
  [shareUrl]="item.shareUrl"
/>

<!-- Lightweight inputs (not clickable) -->
<ccms-resource-chip
  [filename]="item.filename"
  [ditaType]="item.ditaType"
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ResourceChipComponent>;

/**
 * Ditamap file with green indicator.
 */
export const Ditamap: Story = {
  args: {
    resource: {
      resourceUuid: '123e4567-e89b-12d3-a456-426614174000',
      branchName: 'main',
      resourceCreateTime: '2025-01-15T10:30:00Z',
      path: '/content/maps',
      ezdPath: '/content/maps/user-guide.ditamap',
      fileName: 'user-guide.ditamap',
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      directoryUuid: '123e4567-e89b-12d3-a456-426614174002',
      ownerUsername: 'jdoe',
      creatorUsername: 'jdoe',
      lastModified: '2025-01-15T10:30:00Z',
      contentMimeType: 'application/dita+xml',
      metadata: {
        title: 'User Guide',
        status: 'published',
        'dita-class': '- map/map ',
      },
      permOwner: 'jdoe',
      ownerGroup: 'users',
      mode: 'rw-r--r--',
      contentHashMd5: 'd41d8cd98f00b204e9800998ecf8427e',
      contentHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [resource]="resource" />`,
  }),
};

/**
 * Dita topic file with light blue indicator.
 */
export const DitaTopic: Story = {
  args: {
    resource: {
      resourceUuid: '223e4567-e89b-12d3-a456-426614174000',
      branchName: 'main',
      resourceCreateTime: '2025-01-15T10:35:00Z',
      path: '/content/topics',
      ezdPath: '/content/topics/introduction.dita',
      fileName: 'introduction.dita',
      uuid: '223e4567-e89b-12d3-a456-426614174001',
      directoryUuid: '223e4567-e89b-12d3-a456-426614174002',
      ownerUsername: 'jdoe',
      creatorUsername: 'jdoe',
      lastModified: '2025-01-15T10:35:00Z',
      contentMimeType: 'application/dita+xml',
      metadata: {
        title: 'Introduction to DITA',
        status: 'draft',
        'dita-class': '- topic/topic ',
      },
      permOwner: 'jdoe',
      ownerGroup: 'users',
      mode: 'rw-r--r--',
      contentHashMd5: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      contentHashSha256: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [resource]="resource" />`,
  }),
};

/**
 * Ditamap file with detailed custom title in metadata.
 */
export const WithCustomTitle: Story = {
  args: {
    resource: {
      resourceUuid: '323e4567-e89b-12d3-a456-426614174000',
      branchName: 'main',
      resourceCreateTime: '2025-01-15T11:00:00Z',
      path: '/content/maps',
      ezdPath: '/content/maps/product-documentation.ditamap',
      fileName: 'product-documentation.ditamap',
      uuid: '323e4567-e89b-12d3-a456-426614174001',
      directoryUuid: '323e4567-e89b-12d3-a456-426614174002',
      ownerUsername: 'asmith',
      creatorUsername: 'asmith',
      lastModified: '2025-01-15T11:00:00Z',
      contentMimeType: 'application/dita+xml',
      metadata: {
        title: 'Complete Product Documentation - Version 2.0',
        status: 'review',
        'dita-class': '- map/map ',
      },
      permOwner: 'asmith',
      ownerGroup: 'users',
      mode: 'rw-r--r--',
      contentHashMd5: 'f1e2d3c4b5a6978869504132',
      contentHashSha256: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [resource]="resource" />`,
  }),
};

/**
 * File without title metadata - displays filename as title.
 */
export const WithoutTitle: Story = {
  args: {
    resource: {
      resourceUuid: '423e4567-e89b-12d3-a456-426614174000',
      branchName: 'main',
      resourceCreateTime: '2025-01-15T11:15:00Z',
      path: '/content/topics',
      ezdPath: '/content/topics/untitled.dita',
      fileName: 'untitled.dita',
      uuid: '423e4567-e89b-12d3-a456-426614174001',
      directoryUuid: '423e4567-e89b-12d3-a456-426614174002',
      ownerUsername: 'jdoe',
      creatorUsername: 'jdoe',
      lastModified: '2025-01-15T11:15:00Z',
      contentMimeType: 'application/dita+xml',
      metadata: {
        status: 'draft',
        'dita-class': '- topic/topic ',
      },
      permOwner: 'jdoe',
      ownerGroup: 'users',
      mode: 'rw-r--r--',
      contentHashMd5: 'g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7',
      contentHashSha256: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [resource]="resource" />`,
  }),
};

/**
 * Lightweight mode - DITA topic with ezdPath tooltip.
 */
export const LightweightTopic: Story = {
  args: {
    filename: 'getting-started.dita',
    ditaType: 'TOPIC',
    ezdPath: '/content/guides/getting-started.dita',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [filename]="filename" [ditaType]="ditaType" [ezdPath]="ezdPath" />`,
  }),
};

/**
 * Lightweight mode - DITA map with ezdPath tooltip.
 */
export const LightweightMap: Story = {
  args: {
    filename: 'product-guide.ditamap',
    ditaType: 'MAP',
    ezdPath: '/content/maps/product-guide.ditamap',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [filename]="filename" [ditaType]="ditaType" [ezdPath]="ezdPath" />`,
  }),
};

/**
 * Lightweight mode - non-DITA file (no icon).
 */
export const LightweightNonDita: Story = {
  args: {
    filename: 'readme.txt',
    ditaType: 'NON_DITA',
    ezdPath: '/content/readme.txt',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip [filename]="filename" [ditaType]="ditaType" [ezdPath]="ezdPath" />`,
  }),
};

/**
 * Full mode - displays title and filename in two lines.
 */
export const FullModeWithTitle: Story = {
  args: {
    mode: 'full',
    title: 'Getting Started Guide',
    filename: 'getting-started.dita',
    ditaType: 'TOPIC',
    ezdPath: '/content/topics/getting-started.dita',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip
      [mode]="mode"
      [title]="title"
      [filename]="filename"
      [ditaType]="ditaType"
      [ezdPath]="ezdPath"
    />`,
  }),
};

/**
 * Full mode with map type.
 */
export const FullModeMap: Story = {
  args: {
    mode: 'full',
    title: 'Product Documentation',
    filename: 'product-docs.ditamap',
    ditaType: 'MAP',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip
      [mode]="mode"
      [title]="title"
      [filename]="filename"
      [ditaType]="ditaType"
    />`,
  }),
};

/**
 * Clickable with direct shareUrl.
 */
export const ClickableWithShareUrl: Story = {
  args: {
    mode: 'full',
    title: 'Installation Instructions',
    filename: 'installation.dita',
    ditaType: 'TOPIC',
    shareUrl: '/share/abc-123-def',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip
      [mode]="mode"
      [title]="title"
      [filename]="filename"
      [ditaType]="ditaType"
      [shareUrl]="shareUrl"
    />`,
  }),
};

/**
 * Full mode without title - only filename displayed.
 */
export const FullModeNoTitle: Story = {
  args: {
    mode: 'full',
    filename: 'untitled-topic.dita',
    ditaType: 'TOPIC',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-resource-chip
      [mode]="mode"
      [filename]="filename"
      [ditaType]="ditaType"
    />`,
  }),
};

/**
 * Multiple chips in a list (full mode).
 */
export const FullModeList: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
        <ccms-resource-chip
          mode="full"
          title="Introduction to DITA"
          filename="intro.dita"
          ditaType="TOPIC"
          shareUrl="/share/1"
        />
        <ccms-resource-chip
          mode="full"
          title="User Guide Map"
          filename="user-guide.ditamap"
          ditaType="MAP"
          shareUrl="/share/2"
        />
        <ccms-resource-chip
          mode="full"
          title="Advanced Configuration"
          filename="advanced-config.dita"
          ditaType="TOPIC"
        />
      </div>
    `,
  }),
};
