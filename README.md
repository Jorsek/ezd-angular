# ezd-angular

Angular component library for embedded components in Heretto CCMS. This project provides reusable UI components designed to be deployed to CDN and integrated into existing CCMS, initially supporting gradual migration from GWT to Angular.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [Storybook](#storybook)
- [Building for Production](#building-for-production)
- [CDN Deployment](#cdn-deployment)
- [GWT Integration](#gwt-integration)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Overview

This monorepo workspace contains:

- **Shared Library** (`projects/shared`): Reusable UI components, services, and models
- **Elements Runtime** (`projects/elements`): Bootstraps Angular and registers custom elements (deployed to CDN, loaded by ezd)

### Technology Stack

- **Angular**: v20.3.0+ (latest with default standalone components)
- **Node.js**: v20.19.0+ (required)
- **TypeScript**: v5.9.2 with strict mode
- **Package Manager**: npm
- **Build System**: Angular CLI with esbuild
- **Testing**: Karma + Jasmine, AXE for accessibility
- **Linting**: ESLint with Angular best practices
- **Change Detection**: Zoneless - no zone.js runtime dependency

## Architecture

### Design Principles

All code follows these mandatory principles from [`docs/llms/angular-best-practices.md`](docs/llms/angular-best-practices.md):

- ✅ Standalone components (no NgModules)
- ✅ Signal-based state management
- ✅ OnPush change detection
- ✅ `input()` and `output()` functions (not decorators)
- ✅ `inject()` function for dependency injection
- ✅ Native control flow (`@if`, `@for`, `@switch`)
- ✅ TypeScript strict mode (no `any` types)
- ✅ WCAG AA accessibility compliance
- ✅ Google style guide adherence

### Key Architectural Decisions

**Zoneless Change Detection**

This project uses Angular's zoneless change detection (`provideZonelessChangeDetection`). This reduces bundle size (~15-20KB) and improves performance. All components use signals and OnPush change detection, making them fully zoneless-compatible.

**No Angular Forms Dependency**

This project intentionally does not use `@angular/forms` (Reactive Forms or Template-Driven Forms). Instead, we use signal-based state management directly. This approach was chosen because:

- **Signal efficiency**: Signals provide fine-grained reactivity without the overhead of form abstractions
- **Simpler mental model**: Direct signal binding (`[value]="signal()"` + `(input)="update()"`) is more explicit than form control wiring
- **Smaller bundle size**: No additional forms module dependency (~40KB+ savings)
- **Future-proof**: Angular is introducing Signal Forms in v21 (November 2025) as an experimental feature, which will integrate signals natively with forms. Our current signal-based approach aligns with this direction and will make migration straightforward.

## Prerequisites

### Required

- **Node.js**: v20.19.0 or newer ([Download](https://nodejs.org/))
- **npm**: v11.6.2+ (comes with Node.js)
- **Angular CLI**: v20.3.9+ (install globally)

### Installation

```bash
# Verify Node.js version
node --version  # Should be v20.19.0+

# Install Angular CLI globally
npm install -g @angular/cli@latest

# Verify Angular CLI installation
ng version
```

## Getting Started

### Clone and Install

```bash
# Navigate to project directory
cd ccms-components-angular

# Install dependencies
npm install

# Verify installation
npm run lint
```

## Local Development

### Current Workflow: GWT Integration

The primary development workflow uses the `watch` script, which builds the shared library and serves the elements runtime:

```bash
npm run watch
```

**What this does:**
1. Builds the shared library once
2. Watches for changes and rebuilds the library automatically
3. Serves the elements runtime at `http://localhost:4200` (ezd.html loads this to register custom elements)

**Testing your changes:**
1. Run `npm run watch` in this repository
2. Start the GWT application (ezd)
3. Trigger Angular components from GWT UI (e.g., right-click → Find)
4. Make changes to components - they'll rebuild and hot reload automatically

### Understanding the Elements Runtime

The `elements` project bootstraps Angular and registers custom elements (via `customElements.define()`). It's the production runtime deployed to CDN and loaded by ezd - not a standalone dev app.

- **Dev:** Served at `localhost:4200` by `npm run watch`, loaded by ezd.html
- **Prod:** Built bundle deployed to CDN, loaded by production ezd.html

**Limitation:** Cannot run standalone (CORS issues with TurboDITA). Component development requires either running ezd or using Storybook.

> **💡 Tip:** For isolated component development without running the full ezd application, see the [Storybook](#storybook) section below.

### Creating New Components

```bash
# Generate component in shared library
ng generate component button --project=shared

# Follow the example in projects/shared/src/lib/button/
```

### Component Development Checklist

When creating new components, ensure:

- [ ] Standalone component (default, don't set `standalone: true`)
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Use `input()` and `output()` functions
- [ ] Signal-based state with `signal()` and `computed()`
- [ ] Host bindings in `@Component` decorator (not `@HostBinding`)
- [ ] Native control flow in templates (`@if`, `@for`, not `*ngIf`, `*ngFor`)
- [ ] ARIA attributes for accessibility
- [ ] CSS with WCAG AA color contrast
- [ ] Minimum 44px touch targets
- [ ] Unit tests with accessibility checks
- [ ] TSDoc comments for public APIs

### Development Commands

```bash
# Primary development workflow
npm run watch                     # Build shared + watch + serve elements (recommended)

# Alternative commands
npm run build:elements            # Build elements runtime for CDN deployment
npm run deploy:ezd                # Build elements and copy to ezd project

# Code Formatting
npm run format                    # Auto-format all files (ts, html, css)
npm run format:check              # Check formatting (used in CI)

# Testing
ng test shared                    # Run shared library tests
ng test shared --code-coverage    # Run tests with coverage
npm run lint                      # Lint all projects

# Note: The elements build automatically includes all shared library code
# No need to build the shared library separately for deployment
```

## Storybook

Storybook provides isolated component development and documentation without requiring the full GWT application.

### Overview

[Storybook](https://storybook.js.org/) is integrated for component-driven development:

- ✅ **Isolated Development**: Develop components independently without running ezd
- ✅ **Interactive Documentation**: Auto-generated docs with props tables and usage examples
- ✅ **Visual Testing**: Preview all component variants and states
- ✅ **No CORS Issues**: Built-in webpack proxy forwards `/api/*` requests to `localhost:8080`
- ✅ **Hot Reload**: Changes to components reflect immediately
- ✅ **Angular 20 Support**: Full support for signals, standalone components, and zoneless change detection

### Quick Start

```bash
# Start Storybook development server
npm run storybook

# Access at http://localhost:6006
```

### Creating Stories

Stories are colocated with components using the `.stories.ts` extension:

```typescript
// Example: component-name.stories.ts
import type { Meta, StoryObj } from '@storybook/angular';
import { MyComponent } from './my-component';

const meta: Meta<MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    myInput: {
      control: 'text',
      description: 'Description of the input',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
Component description with markdown support.

### Features
- Feature 1
- Feature 2
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<MyComponent>;

export const Default: Story = {
  args: {
    myInput: 'Hello World',
  },
  render: (args) => ({
    props: args,
    template: `<ccms-my-component [myInput]="myInput" />`,
  }),
};
```

### Features

**Automatic Documentation**
- Component descriptions rendered as markdown
- Auto-generated props tables from TypeScript types
- Interactive controls for testing inputs
- Multiple story variants for different states

**API Proxy**
- Configured in `.storybook/main.ts`
- Proxies `/api/*` requests to `http://localhost:8080`
- Start ezd backend locally for components that need real API data
- No CORS issues when developing components

### Story File Locations

Story files follow the pattern `*.stories.ts` and are colocated with components:

```
projects/shared/src/lib/components/
└── resource-chip/
    ├── resource-chip.ts
    ├── resource-chip.html
    ├── resource-chip.css
    └── resource-chip.stories.ts    ← Story file
```

### Build Storybook

Build a static version of Storybook for deployment:

```bash
npm run build-storybook

# Output: storybook-static/
```

### Deployment

The GitHub Actions workflow generates downloadable Storybook artifacts for all builds. See the [Building for Production](#building-for-production) section for details.

### Configuration

**Main Configuration** (`.storybook/main.ts`)
- Story file pattern: `projects/shared/src/lib/**/*.stories.ts`
- Addon: `@storybook/addon-docs` for documentation
- Webpack proxy for API requests

**Preview Configuration** (`.storybook/preview.ts`)
- Global autodocs enabled
- Zoneless change detection
- Control matchers for color and date inputs

### Best Practices

1. **Colocate stories** with components for maintainability
2. **Use descriptive story names** that indicate the variant/state
3. **Document with markdown** in `parameters.docs.description`
4. **Configure argTypes** for better interactive controls
5. **Create multiple stories** for different component states
6. **Use the `autodocs` tag** to generate documentation pages

## Building for Production

### Build Commands

```bash
# Build everything (recommended)
npm run build:all                 # Builds elements + storybook

# Build individual artifacts
npm run build:shared              # Shared library (build-time dependency)
npm run build:elements            # Elements runtime (includes all components)
npm run build:storybook           # Storybook static site

# Deploy to ezd for local testing
npm run deploy:ezd                # Build elements + copy to ../ezd
```

### Build Output Structure

```
dist/
└── elements/                  # Elements runtime (CDN-ready)
    └── browser/
        ├── main-[hash].js     # Complete bundle with all components (~203KB)
        ├── styles-[hash].css  # Compiled styles
        └── 3rdpartylicenses.txt

storybook-static/              # Storybook documentation site (deployable)
└── ...
```

**Note:** The elements bundle includes all components from the shared library.

**Build Dependencies:**
- **Local:** Elements can build directly from shared library source (no pre-build needed)
- **CI/CD:** Shared library must be built first so elements can resolve TypeScript imports
- **Deployment:** Only the elements bundle is deployed (shared is a build-time dependency)

### Automated Builds (GitHub Actions)

Every push to `main` automatically triggers the build workflow (`.github/workflows/build-artifacts.yml`):

**What it does:**
- ✅ Builds elements runtime (complete bundle with all components)
- ✅ Builds Storybook documentation site
- ✅ Generates bundle size reports
- ✅ Uploads timestamped artifacts with retention

**Access build artifacts:**
1. Go to GitHub Actions tab
2. Click on latest "Build Artifacts" workflow run
3. Download artifacts from the "Artifacts" section:
   - `elements-runtime-YYYYMMDD-HHMMSS` (90-day retention)
   - `storybook-site-YYYYMMDD-HHMMSS` (30-day retention)
   - `bundle-size-report-YYYYMMDD-HHMMSS` (30-day retention)

### Build Configuration

Production builds include:

- Tree-shaking for minimal bundle size
- Minification and optimization
- Source maps for debugging
- AOT compilation
- Output hashing for cache busting

## CDN Deployment

### Preparing for CDN

The libraries are designed to be deployed to a CDN and consumed by other applications.

### Deployment Process

1. **Build library for production** (see above)
2. **Upload** `dist/` directory contents to your CDN
3. **Version management**: Use semantic versioning in URLs
4. **Configure** consuming application to load from CDN

### CDN Structure Example

```
https://your-cdn.com/
├── ccms-components/
│   ├── v1.0.0/
│   │   └── shared/
│   └── latest/          # Symlink to latest version
```

## GWT Integration

Angular components are integrated into the GWT application using **Web Components (Custom Elements)** via `@angular/elements`. All components share a single Angular runtime and can communicate through shared services.

**Key Integration Points:**
- Components loaded as native custom elements in GWT
- GWT creates elements using standard DOM API (`createElement`, `setAttribute`)
- Data passed via HTML attributes (kebab-case)
- Components self-remove when closed

**For complete integration details, architecture, and code examples, see:**
- **[docs/gwt-integration.md](docs/gwt-integration.md)** - Complete integration guide

## Best Practices

### Code Style

This project follows:

- [Angular Official Best Practices](https://angular.dev/style-guide)
- Google TypeScript Style Guide
- Custom rules in `.eslintrc.json`

### State Management

```typescript
// ✅ DO: Use signals for state
protected count = signal<number>(0);
protected doubled = computed(() => this.count() * 2);

// ✅ DO: Use update() or set() to modify signals
this.count.update(n => n + 1);
this.count.set(0);

// ❌ DON'T: Use mutate()
this.count.mutate(n => n++);  // NOT ALLOWED
```

### Component Inputs/Outputs

```typescript
// ✅ DO: Use input() and output() functions
value = input<number>(0);
valueChange = output<number>();

// ❌ DON'T: Use decorators
@Input() value: number = 0;     // NOT ALLOWED
@Output() valueChange = ...;    // NOT ALLOWED
```

### Dependency Injection

```typescript
// ✅ DO: Use inject() function
export class MyService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
}

// ❌ DON'T: Use constructor injection
constructor(private http: HttpClient) {}  // NOT ALLOWED
```

### Templates

```typescript
// ✅ DO: Use native control flow
@if (showContent) {
  <p>Content</p>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

// ❌ DON'T: Use structural directives
<p *ngIf="showContent">...</p>      // NOT ALLOWED
<div *ngFor="let item of items">    // NOT ALLOWED
```

### Accessibility

All components MUST:

- Pass AXE accessibility checks
- Meet WCAG AA standards
- Include proper ARIA attributes
- Support keyboard navigation
- Have sufficient color contrast
- Use semantic HTML
- Provide text alternatives

## Testing

### Unit Tests

```bash
# Run tests for specific project
ng test shared

# Run with coverage
ng test shared --code-coverage

# Run in headless mode (CI)
ng test shared --browsers=ChromeHeadless --watch=false
```

### Accessibility Testing

Components use `jasmine-axe` for automated accessibility testing:

```typescript
import { toHaveNoViolations } from 'jasmine-axe';

expect(jasmine).toHaveNoViolations();
const result = await axe(fixture.nativeElement);
expect(result).toHaveNoViolations();
```

### Testing Checklist

- [ ] Unit tests for all public APIs
- [ ] Accessibility tests with AXE
- [ ] Keyboard navigation tests
- [ ] ARIA attribute validation
- [ ] Edge cases and error handling
- [ ] Signal state transitions
- [ ] Event emission verification

## Project Structure

```
ccms-components-angular/
├── .storybook/                    # Storybook configuration
│   ├── main.ts                    # Storybook main config (addons, webpack proxy)
│   ├── preview.ts                 # Preview config (global decorators, autodocs)
│   └── tsconfig.json              # TypeScript config for Storybook
├── projects/
│   ├── shared/                    # Shared library (components, services, models)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/    # UI Components
│   │   │   │   │   ├── resource-chip/
│   │   │   │   │   │   ├── resource-chip.ts
│   │   │   │   │   │   ├── resource-chip.html
│   │   │   │   │   │   ├── resource-chip.css
│   │   │   │   │   │   └── resource-chip.stories.ts  ← Storybook story
│   │   │   │   │   ├── button/
│   │   │   │   │   │   ├── button.component.ts
│   │   │   │   │   │   ├── button.component.html
│   │   │   │   │   │   ├── button.component.css
│   │   │   │   │   │   └── button.component.spec.ts
│   │   │   │   │   └── find-replace/
│   │   │   │   │       └── ...
│   │   │   │   ├── services/      # Injectable services
│   │   │   │   │   └── find-replace/
│   │   │   │   │       ├── find-replace.service.ts
│   │   │   │   │       └── models/
│   │   │   │   └── models/        # TypeScript interfaces
│   │   │   │       └── resource-file.interface.ts
│   │   │   └── public-api.ts      # Public API surface
│   │   └── package.json
│   └── elements/                   # Angular Elements runtime (registers custom elements)
│       ├── src/
│       │   ├── app/
│       │   │   ├── app.ts         # Root component
│       │   │   ├── app.config.ts
│       │   │   └── app.routes.ts
│       │   ├── main.ts
│       │   └── index.html
│       └── tsconfig.app.json
├── dist/                          # Build output (CDN-ready)
├── storybook-static/              # Built Storybook (for deployment)
├── docs/                          # Documentation
│   └── llms/
│       ├── angular-best-practices.md  # Mandatory coding standards
│       └── angular-llms-full.md       # Angular documentation
├── angular.json                   # Angular workspace config
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config (strict mode)
├── .eslintrc.json                # ESLint configuration
└── README.md                      # This file
```

## Contributing

### Development Standards

1. **Read** [`docs/llms/angular-best-practices.md`](docs/llms/angular-best-practices.md) - ALL rules are mandatory
2. **Follow** the example component in `projects/shared/src/lib/components/button/`
3. **Run linter** before committing: `npm run lint`
4. **Write tests** for all new components/services
5. **Check accessibility** with AXE
6. **Document** public APIs with TSDoc comments

## Additional Resources

- [Angular Official Documentation](https://angular.dev)
- [Angular Style Guide](https://angular.dev/style-guide)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
