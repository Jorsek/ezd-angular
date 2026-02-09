# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 21 monorepo workspace for building CCMS (Component Content Management System) components that will be deployed to CDN and embedded in an existing GWT application. The project supports a gradual migration from GWT to Angular over three phases.

**Key Context:**
- Angular v21+ with default standalone components
- **Zoneless Angular** - This app does NOT use Zone.js. Never use `NgZone`, `zone.run()`, or any zone-related code. Signal updates automatically trigger change detection.
- **Vitest** - Testing uses Vitest (not Jasmine/Karma). Use `vi.fn()`, `vi.spyOn()`, NOT `jasmine.createSpy()` or `spyOn()`.
- CDN-deployable JavaScript bundles for GWT integration
- Strict adherence to `docs/llms/angular-best-practices.md` (mandatory rules)
- Google style guide compliance for code formatting and linting
- WCAG AA accessibility compliance is required

## Essential Commands

### Development
```bash
# Primary development workflow (builds shared + serves elements)
npm run watch

# Build library (required before testing integration)
ng build shared --configuration production

# Watch library changes only
ng build shared --watch

# Build elements runtime for CDN deployment
ng build elements --configuration production
```

**IMPORTANT: Do NOT run `npm run watch` or `ng build` commands.** The user will already have `npm run watch` running, which handles rebuilding automatically.

### Testing & Quality
```bash
# Lint all projects (must pass before commits)
npm run lint

# Run tests
ng test shared

# Run tests without watch mode
ng test shared --watch=false

# Run with coverage
ng test shared --code-coverage
```

**Testing Guidelines:**
- Write high-value tests that verify meaningful behavior, not just instantiation
- Do NOT write trivial "should create" tests like `expect(component).toBeTruthy()`
- Focus tests on: user interactions, output events, computed state, edge cases
- Each test should verify a specific behavior or requirement

### Pre-Checkin Workflow

**IMPORTANT: Always run these commands before committing changes:**

```bash
# 1. Run linting (must pass)
npm run lint

# 2. Run tests (must pass)
ng test shared --watch=false

# 3. Format all files
npm run format
```

All three must complete successfully before checking in code.

### Component Generation
```bash
# Generate component in shared library
ng generate component my-component --project=shared

# Generate service in shared library
ng generate service my-service --project=shared
```

**IMPORTANT: Component Folder Structure**
- All UI components MUST be placed in `projects/shared/src/lib/components/`
- Models/interfaces go in `projects/shared/src/lib/models/`
- Services go in `projects/shared/src/lib/services/`
- After generating a component with Angular CLI, move it to the correct folder if needed
- Example: Move from `projects/shared/src/lib/my-component/` to `projects/shared/src/lib/components/my-component/`

### Version Control

**After creating new components/services, add them to git:**

```bash
# Check what files were created
git status

# Add new files to staging
git add projects/shared/src/lib/components/my-component/
git add projects/shared/src/lib/services/my-service/

# Add modified exports
git add projects/shared/src/public-api.ts

# Add custom element registration if applicable
git add projects/elements/src/main.ts

# Add any dependency changes
git add package.json package-lock.json
```

**IMPORTANT: Always add new files to git**
- Component files (`.ts`, `.html`, `.css`, `.stories.ts`)
- Service files
- Updated `public-api.ts` exports
- Custom element registrations in `projects/elements/src/main.ts`
- Configuration files (`.storybook/*` if modified)
- Dependency changes (`package.json`, `package-lock.json`)

### Storybook (Component Documentation & Development)
```bash
# Start Storybook development server
npm run storybook

# Build static Storybook site
npm run build-storybook
```

Storybook runs at `http://localhost:6006/` and provides:
- Interactive component playground with live editing
- Visual documentation of all component variants
- Automated controls for component inputs
- Accessibility testing integration

**Creating Stories:**
- Colocate story files with components: `component-name.stories.ts`
- Follow the pattern in `projects/shared/src/lib/components/resource-chip/resource-chip.stories.ts`
- Stories are automatically excluded from library builds

**API Proxy Configuration:**
- Storybook proxies `/api/*` requests to `http://localhost:8080` (ezd backend)
- No CORS issues when making API calls from components
- Requires ezd backend running locally for components that fetch data
- Proxy configuration in `.storybook/main.ts` can be customized for other endpoints

## Workflow Guidelines

### When Working on Angular Code (ccms-components)

**ALWAYS do these after making changes:**
1. ✅ Run `npm run lint` to verify all linting rules pass
2. ✅ Verify TypeScript compiles without errors
3. ✅ Test components in Storybook when applicable
4. ✅ Follow all patterns in `docs/llms/angular-best-practices.md`
5. ✅ Ensure accessibility requirements are met (WCAG AA)

**Code quality checklist:**
- No `any` types (enforced by ESLint)
- All components use `OnPush` change detection
- Proper TypeScript types for all function parameters and return values
- Accessibility attributes present on interactive elements

### When Working on GWT/Java Code

**DO NOT:**
- ❌ Run Angular linting (`npm run lint`)
- ❌ Use Angular-specific commands
- ❌ Apply Angular best practices to Java code

**Instead:**
- Follow Java/GWT conventions
- Use appropriate Java tooling and linters
- Maintain separation between GWT and Angular codebases

### When Working on Server-Side Code

**DO NOT:**
- ❌ Run Angular linting
- ❌ Apply frontend patterns to backend code

**Instead:**
- Follow server-side best practices
- Use appropriate backend tooling

### Context Management (Token Efficiency)

**Use `/clear` command when:**
- Switching between major subsystems (Angular ↔ GWT ↔ Server)
- Starting work on a completely different feature area
- Previous conversation context is no longer relevant
- You want a fresh start on a new task

**After `/clear`, provide context:**
```
/clear
Now working on [Angular components | GWT integration | Server API | etc.]
```

**Don't clear when:**
- Making small changes within the same subsystem
- Working on related features
- Context from previous messages is still relevant

**Note:** The system automatically summarizes old conversations, providing effectively unlimited context. However, clearing strategically can improve focus and reduce noise when switching between major areas of the codebase.

## Architecture

### Monorepo Structure

The workspace contains two projects:

**`projects/shared/`** - Component library (components, services, models)
- Visual components following best practices
- Services and business logic
- TypeScript interfaces and models
- Organized into folders:
  - `src/lib/components/` - UI components
  - `src/lib/services/` - Injectable services
- Each component in its own directory with `.ts`, `.html`, `.css`, `.spec.ts`
- All components use signals, OnPush, and accessibility best practices
- Exports: `projects/shared/src/public-api.ts`

**`projects/elements/`** - Angular Elements runtime (registers custom elements)
- Bootstraps Angular and registers custom elements via `customElements.define()`
- **Deployed to CDN** and loaded by ezd in both dev and production
- **Dev:** Served at `localhost:4200` by `npm run watch`, loaded by ezd.html
- **Prod:** Built bundle deployed to CDN, loaded by production ezd.html
- **Limitation:** Cannot run standalone due to CORS issues with TurboDITA

### Build Output Structure

```
dist/
└── shared/
    └── fesm2022/
        └── shared.mjs         # ES Module bundle
```

This `.mjs` file is deployed to CDN and loaded by the GWT application.

### Key Architectural Patterns

**Signal-Based State Management:**
- All component state uses `signal()` for reactivity
- Derived state uses `computed()`
- Updates use `set()` or `update()`, NEVER `mutate()`

**Component Communication:**
- Parent → Child: `input()` function (not `@Input()` decorator)
- Child → Parent: `output()` function (not `@Output()` decorator)
- Two-way binding: `model()` function for writable signals (Angular 17.2+)
- Services: Use `inject()` function (not constructor injection)

**Styling Strategy:**
- Scoped component styles (ViewEncapsulation.Emulated by default)
- CSS custom properties (`:root` variables) for design tokens
- No global styles that could conflict with GWT
- WCAG AA color contrast required (4.5:1 for text)

## Mandatory Best Practices

**CRITICAL:** All code must follow `docs/llms/angular-best-practices.md`. Key requirements:

### Components
- ✅ Standalone components (default in Angular 19+)
- ✅ **NEVER** set `standalone: true` in decorators (it's automatic)
- ✅ `changeDetection: ChangeDetectionStrategy.OnPush` required
- ✅ Use `input()` and `output()` functions, NOT decorators
- ✅ Host bindings in `host` object, NOT `@HostBinding`/`@HostListener`
- ✅ Template syntax: `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`, `*ngSwitch`)
- ✅ Class bindings: `[class.foo]="condition"` (NOT `ngClass`)
- ✅ Style bindings: `[style.color]="value"` (NOT `ngStyle`)

### State Management
```typescript
// ✅ CORRECT
protected count = signal<number>(0);
protected doubled = computed(() => this.count() * 2);
this.count.update(n => n + 1);

// ❌ WRONG
this.count.mutate(n => n++);  // mutate() is forbidden
```

### Inputs/Outputs
```typescript
// ✅ CORRECT - One-way inputs
variant = input<'primary' | 'secondary'>('primary');
buttonClick = output<MouseEvent>();

// ✅ CORRECT - Two-way binding with model()
searchPattern = model.required<string>();  // In child component
// Parent template: <child [(searchPattern)]="parentSignal" />

// ❌ WRONG
@Input() variant: string;     // Decorators not allowed
@Output() buttonClick = ...;  // Decorators not allowed
```

### Dependency Injection
```typescript
// ✅ CORRECT
export class MyService {
  private http = inject(HttpClient);
}

// ❌ WRONG
constructor(private http: HttpClient) {}  // Not allowed
```

### Templates
```typescript
// ✅ CORRECT
@if (showContent) {
  <p>Content</p>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

// ❌ WRONG
<p *ngIf="showContent">...</p>       // Structural directives forbidden
<div *ngFor="let item of items">     // Structural directives forbidden
```

### Accessibility Requirements
- MUST pass AXE checks (use `vitest-axe` in tests)
- MUST meet WCAG AA standards
- Minimum 44px touch targets
- Proper ARIA attributes for all interactive elements
- Keyboard navigation support (Enter and Space keys)
- Focus management

## Reference Implementation

See `projects/shared/src/lib/components/button/button.component.ts` for a complete example demonstrating all required patterns:
- Signal-based state (`signal()`, `computed()`)
- Input/output functions
- OnPush change detection
- Host bindings in decorator
- ARIA attributes and keyboard accessibility
- Native control flow in template (`@if`, `@else`)
- Protected methods for template use

## ESLint Configuration

Component selectors MUST use these prefixes:
- `ccms-*` for library components (shared)
- `app-*` for elements components only

Strict rules enforced:
- `@typescript-eslint/no-explicit-any`: error (no `any` types)
- `@angular-eslint/prefer-on-push-component-change-detection`: error
- `@angular-eslint/template/accessibility`: all rules error
- Component and directive class name suffixes required

## GWT Integration Context

Components are designed for embedding in a GWT application using Web Components (Custom Elements) via `@angular/elements`.

**Development Workflow:**
1. Run `npm run watch` in this repository (serves elements at localhost:4200)
2. Start the GWT application (ezd)
3. ezd.html loads the Angular runtime from localhost:4200
4. Custom elements are registered and available to GWT
5. Make changes to components - they rebuild and hot reload automatically

**Key Integration Implications:**
1. **No Global Dependencies**: Components must be self-contained
2. **Style Isolation**: Use scoped styles to avoid GWT conflicts
3. **Event Communication**: Components communicate via outputs, not global events
4. **Lifecycle Management**: GWT controls component mounting/unmounting
5. **Shared Runtime**: All components share a single Angular runtime instance

See `docs/gwt-integration.md` for detailed integration patterns.

## TypeScript Configuration

Strict mode enabled with:
- `strict: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

Target: ES2022, Module: preserve (for modern bundling)

## Build Process

Libraries use `ng-packagr` which generates:
- FESM (Flat ES Modules) in `fesm2022/`
- TypeScript definitions (`.d.ts`)
- Package metadata (`package.json`)
- Source maps for debugging

Production builds include:
- Tree-shaking
- Minification
- AOT compilation
- Output hashing for cache busting

## Prettier Configuration

Automatic formatting with:
- `printWidth: 100`
- `singleQuote: true`
- HTML files use Angular parser

Format before committing (happens automatically in most IDEs).
