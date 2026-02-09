# GWT Integration Guide

This document describes how Angular components from this library are integrated into the existing GWT application.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Component Reference](#component-reference)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Adding New Components](#adding-new-components)
- [Troubleshooting](#troubleshooting)

## Overview

Angular components are integrated into the GWT application using **Web Components (Custom Elements)**. This approach provides:

- **Framework-agnostic integration** - GWT treats Angular components as native HTML elements
- **Simple API** - Standard DOM methods (`createElement`, `setAttribute`, `appendChild`)
- **Browser-native lifecycle** - No manual mounting/unmounting required
- **Style isolation** - Shadow DOM prevents style conflicts
- **Incremental migration** - Add Angular components gradually without rewriting GWT

### Architecture

```
┌─────────────────────────────────────────────┐
│  GWT Application (ezd.html)                 │
│  ┌───────────────────────────────────────┐  │
│  │  1. Load Angular bundle (main.js)     │  │
│  │     - Bootstraps Angular app          │  │
│  │     - Registers custom elements       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  2. GWT creates custom elements       │  │
│  │     - createElement('ccms-...')       │  │
│  │     - setAttribute('uuid', value)     │  │
│  │     - appendChild(popup)              │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  3. Angular component renders         │  │
│  │     - Reads attributes as inputs      │  │
│  │     - Self-removes when closed        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## How It Works

### 1. Angular Bundle Loading

The GWT host page (`ezd.html`) dynamically loads the Angular bundle:

```html
<!-- Hidden root element for Angular app bootstrap -->
<app-root style="display:none;"></app-root>

<script>
  (function() {
    var script = document.createElement('script');
    script.type = 'module';
    script.id = 'angular-ccms-bundle';

    // Development: Load from Angular dev server
    // Production: Will be changed to CDN path
    script.src = 'http://localhost:4200/main.js';

    script.onerror = function() {
      console.warn('[AngularCCMS] Bundle not available at:', script.src);
    };

    script.onload = function() {
      console.log('[AngularCCMS] Bundle loaded from:', script.src);
    };

    document.body.appendChild(script);
  })();
</script>
```

### 2. Custom Element Registration

When the Angular bundle loads, `main.ts` registers components as custom elements:

```typescript
// projects/elements/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { FindReplacePopupComponent } from 'shared';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    const injector = appRef.injector;

    // Register Angular components as custom elements
    const popupElement = createCustomElement(FindReplacePopupComponent, { injector });
    customElements.define('ccms-find-replace-popup', popupElement);

    console.log('[AngularCCMS] Custom elements registered');
  })
  .catch((err) => console.error(err));
```

### 3. GWT Usage

GWT Java code creates custom elements using JSNI:

```java
// AngularUtil.java
package com.jorsek.apps.contentmanager.client.util;

public final class AngularUtil {

  private AngularUtil() {}

  public static native void openFindReplacePopup(String resourceUuid) /*-{
    var popup = $doc.createElement('ccms-find-replace-popup');
    popup.setAttribute('resource-uuid', resourceUuid);
    $doc.body.appendChild(popup);
  }-*/;

  public static native void openFindReplacePopupForDirectory(String directoryUuid) /*-{
    var popup = $doc.createElement('ccms-find-replace-popup');
    popup.setAttribute('directory-uuid', directoryUuid);
    $doc.body.appendChild(popup);
  }-*/;
}
```

### 4. Attribute Mapping

Angular components use `input()` signals to read HTML attributes. Attribute names are automatically converted from kebab-case to camelCase:

```typescript
// Angular component
export class FindReplacePopupComponent {
  // Reads from 'resource-uuid' HTML attribute
  resourceUuid = input<string>('');

  // Reads from 'directory-uuid' HTML attribute
  directoryUuid = input<string>('');
}
```

### 5. Component Lifecycle

Components manage their own lifecycle:

```typescript
export class FindReplacePopupComponent {
  private elementRef = inject(ElementRef);

  close(): void {
    // Component removes itself from DOM
    this.elementRef.nativeElement.remove();
  }
}
```

## Shared Angular Runtime

All Angular custom elements created from the same bundle share a **single Angular runtime** and application instance.

**Key Points:**

- One Angular application bootstraps and registers all custom elements
- All components share the same dependency injection context
- Services marked with `providedIn: 'root'` are singletons across all components
- Components can communicate through shared Angular services
- The runtime and services persist even when components are removed from the DOM
- Memory efficient - one Angular runtime instead of one per component instance

**Benefits:**

- **Shared State** - Components can share reactive state using signals in services
- **Service Communication** - Components can communicate via event bus or state management services
- **Reduced Bundle Size** - Shared Angular core, RxJS, and other dependencies
- **True Singletons** - Services are instantiated once and available to all components

**Implications:**

- Services persist for the application lifetime, not component lifetime
- Be cautious with global state as it persists across component creation/removal
- All components use the same change detection and zone context

## Component Reference

### ccms-find-replace-popup

A popup dialog for finding and replacing text within DITA resources or directories.

**Element Name:** `ccms-find-replace-popup`

**Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `resource-uuid` | string | UUID of specific resource to search within |
| `directory-uuid` | string | UUID of directory to search within |
| `explicit-only` | boolean | Only search explicit dependencies (optional) |

**Note:** Provide either `resource-uuid` OR `directory-uuid`, not both.

**Example Usage:**

```java
// Search within a specific resource
AngularUtil.openFindReplacePopup(resourceId);

// Search within a directory
AngularUtil.openFindReplacePopupForDirectory(directoryId);
```

**Behavior:**
- Displays modal popup with find/replace interface
- Searches content and displays results
- Allows batch replace operations
- Removes itself from DOM when closed

**Implementation:**
- Location: `projects/shared/src/lib/components/find-replace-popup/`
- Uses Shadow DOM (`ViewEncapsulation.ShadowDom`)
- Styles are fully encapsulated

## Production Deployment

### Build for Production

Build the elements (which includes all integrated components):

```bash
cd ccms-components-angular
ng build elements --configuration production
```

Build output: `dist/elements/browser/`

### Deploy to CDN

1. Upload the `dist/elements/browser/` directory to your CDN:
   ```
   https://your-cdn.com/ccms-components/v1.0.0/
   ├── main-[hash].js
   ├── polyfills-[hash].js
   ├── styles-[hash].css
   └── ...
   ```

2. Update `ezd.html` to load from CDN:
   ```javascript
   // Change from:
   script.src = 'http://localhost:4200/main.js';

   // To:
   script.src = 'https://your-cdn.com/ccms-components/v1.0.0/main-[hash].js';
   ```

### Cache Busting

The Angular build automatically adds content hashes to filenames (`main-ABC123.js`). When deploying a new version:

1. Upload new files to versioned CDN path (e.g., `v1.1.0/`)
2. Update `script.src` in `ezd.html` to new version
3. Deploy updated `ezd.html`

## Adding New Components

To add a new Angular component for GWT integration:

### 1. Create the Component

```bash
ng generate component my-new-component --project=shared
```

### 2. Use Web Component Best Practices

```typescript
import { Component, input, inject, ElementRef } from '@angular/core';
import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ccms-my-component',
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.css',
  encapsulation: ViewEncapsulation.ShadowDom, // Required for GWT isolation
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyNewComponent {
  // Use input() for attributes
  myAttribute = input<string>('');

  private elementRef = inject(ElementRef);

  close(): void {
    // Remove self from DOM when done
    this.elementRef.nativeElement.remove();
  }
}
```

### 3. Export from Library

Add to `projects/shared/src/public-api.ts`:

```typescript
export * from './lib/components/my-new-component/my-new-component.component';
```

### 4. Register as Custom Element

Add to `projects/elements/src/main.ts`:

```typescript
import { MyNewComponent } from 'shared';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    const injector = appRef.injector;

    const myElement = createCustomElement(MyNewComponent, { injector });
    customElements.define('ccms-my-component', myElement);
  });
```

### 5. Create GWT Utility Method

Add to `AngularUtil.java`:

```java
public static native void openMyComponent(String someParam) /*-{
  var element = $doc.createElement('ccms-my-component');
  element.setAttribute('my-attribute', someParam);
  $doc.body.appendChild(element);
}-*/;
```

### 6. Use from GWT

```java
AngularUtil.openMyComponent(paramValue);
```

## Troubleshooting

### Component Not Rendering

**Problem:** Custom element created but nothing appears.

**Solutions:**
1. Check browser console for errors
2. Verify Angular bundle loaded: Look for `[AngularCCMS] Bundle loaded` message
3. Verify custom element registered: Look for `[AngularCCMS] Custom elements registered` message
4. Inspect DOM: Ensure element was created and appended
5. Check element attributes: Verify kebab-case naming (e.g., `resource-uuid` not `resourceUuid`)

### Bundle Not Loading

**Problem:** `[AngularCCMS] Bundle not available` warning.

**Solutions:**
1. Verify Angular dev server is running: `ng serve elements`
2. Check dev server is on port 4200
3. Check browser console for CORS errors
4. Verify `script.src` path in `ezd.html` is correct

### Styles Not Working

**Problem:** Component renders but styles are missing or conflicting with GWT.

**Solutions:**
1. Verify component uses `ViewEncapsulation.ShadowDom`
2. Check that styles are in component's `.css` file, not global styles
3. Inspect element in DevTools: Verify Shadow DOM exists
4. Check for CSS custom properties if sharing design tokens

### Custom Element Already Defined

**Problem:** `DOMException: Failed to execute 'define' on 'CustomElementRegistry'`

**Solutions:**
1. Bundle loaded twice - check for duplicate script tags
2. Custom element name conflict - ensure unique names with `ccms-` prefix
3. Clear browser cache and reload

### Attribute Not Updating

**Problem:** Changed attribute value in GWT but component doesn't update.

**Solutions:**
1. Use `setAttribute()`, not direct property assignment
2. Verify attribute name is kebab-case in HTML
3. Verify `input()` signal in Angular component
4. Check browser console for Angular errors

## Best Practices

### Angular Component Design

1. **Always use Shadow DOM** - `ViewEncapsulation.ShadowDom` prevents style conflicts
2. **Self-contained components** - Don't depend on GWT global state
3. **Attribute-based inputs** - Use `input<string>()` for all data from GWT
4. **Self-removal** - Components should remove themselves when done
5. **OnPush detection** - Use `ChangeDetectionStrategy.OnPush` for performance

### GWT Integration

1. **Centralize utilities** - Keep all JSNI in `AngularUtil.java`
2. **Simple JSNI** - Just create element, set attributes, append to DOM
3. **No component references** - Don't store references to Angular components
4. **Kebab-case attributes** - Always use kebab-case for HTML attributes

## Migration Strategy

The current implementation demonstrates Phase 1 of the GWT-to-Angular migration:

**Phase 1 (Current): Embedded Web Components**
- Small, self-contained UI components
- Minimal coupling with GWT state
- One-way data flow (GWT → Angular via attributes)
- Example: Find/Replace popup

**Phase 2 (Future): Complex Components**
- Larger components with internal state management
- Bidirectional communication if needed (Web Component events)
- Possible iframe isolation for fully independent features

**Phase 3 (Future): Full Application**
- Complete Angular application
- GWT fully deprecated
- Angular takes over routing and state management
