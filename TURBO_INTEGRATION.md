# OpenAPI / TurboDITA Integration

## Overview

The ezd-angular project uses an auto-generated TypeScript Angular API client produced from the TurboDITA backend's OpenAPI spec. The backend (Spring Boot) exposes its spec at `/v3/api-docs.yaml` at runtime. The generated client lives in `projects/shared/src/lib/api/` and includes 18 service classes and 94 model types.

## Current Setup

### Generator

- **Tool:** OpenAPI Generator CLI v7.19.0 (configured in `openapitools.json`)
- **Target:** `typescript-angular` with Angular 21, `providedInRoot: true`, kebab-case file naming
- **Output:** `projects/shared/src/lib/api/`
- **Custom override:** `provide-api.ts` is in `.openapi-generator-ignore` because it contains a fix for JSON response handling

### How to Regenerate Locally

Requires the TurboDITA backend running on port 8081:

```bash
npm run gen:openapi
```

This:
1. Downloads the spec from `http://localhost:8081/v3/api-docs.yaml`
2. Strips the localhost URL from the spec
3. Regenerates the TypeScript Angular client

### What Gets Generated

| Directory | Contents |
|-----------|----------|
| `api/api/` | 18 service classes (one per controller) |
| `api/model/` | 94 model/DTO types |
| `api/configuration.ts` | Client configuration class |
| `api/api.base.service.ts` | Base class for all services |
| `api/provide-api.ts` | Custom Angular provider function (not regenerated) |

## CI Integration

### Recommended Approach: Commit the Spec

Commit the OpenAPI spec (`openapi.yaml`) to the repo root. CI regenerates from it and checks for drift — no backend needed in CI.

#### 1. Update the generation script

Modify `gen:openapi` in `package.json` to also save the spec locally:

```json
"gen:openapi": "curl -s http://localhost:8081/v3/api-docs.yaml -o openapi.yaml && sed -i '' 's|http://localhost:8081||g' openapi.yaml && npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-angular -o projects/shared/src/lib/api --additional-properties=ngVersion=21.0.0,providedInRoot=true,fileNaming=kebab-case"
```

The only change: spec is saved to `openapi.yaml` in the repo root instead of `/tmp/openapi.yaml`.

#### 2. CI job in `.github/workflows/ci.yml`

Replace the placeholder `api-generation` job:

```yaml
api-generation:
  name: API Client Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version-file: .nvmrc
        cache: npm
    - run: npm ci
    - name: Regenerate from committed spec
      run: |
        npx @openapitools/openapi-generator-cli generate \
          -i openapi.yaml \
          -g typescript-angular \
          -o projects/shared/src/lib/api \
          --additional-properties=ngVersion=21.0.0,providedInRoot=true,fileNaming=kebab-case
    - name: Check for drift
      id: drift
      run: |
        DIFF=$(git diff --stat projects/shared/src/lib/api/ || true)
        if [ -z "$DIFF" ]; then
          echo "drifted=false" >> $GITHUB_OUTPUT
        else
          echo "drifted=true" >> $GITHUB_OUTPUT
        fi
      continue-on-error: true
    - name: Summary
      if: always()
      run: |
        if [ "${{ steps.drift.outputs.drifted }}" == "false" ]; then
          echo "## ✅ API Client Up To Date" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Generated code matches committed \`openapi.yaml\` spec." >> $GITHUB_STEP_SUMMARY
        else
          echo "## ❌ API Client Drift Detected" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "The generated API client does not match the committed \`openapi.yaml\`." >> $GITHUB_STEP_SUMMARY
          echo "Run \`npm run gen:openapi\` locally and commit the changes." >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo '```diff' >> $GITHUB_STEP_SUMMARY
          git diff projects/shared/src/lib/api/ | head -100 >> $GITHUB_STEP_SUMMARY
          echo '```' >> $GITHUB_STEP_SUMMARY
          exit 1
        fi
```

#### 3. Developer workflow

1. Start the TurboDITA backend locally (port 8081)
2. Run `npm run gen:openapi`
3. Commit both `openapi.yaml` and any changes in `projects/shared/src/lib/api/`
4. CI verifies they're in sync

If a developer modifies generated files by hand, or forgets to regenerate after a backend change, CI catches it.

## Verifying API Version Matches Backend

The OpenAPI spec has an `info.version` field (currently `v0`). This can be used as the contract between frontend and backend.

### Spec Version Tracking

When the backend API changes, the process is:

1. Backend developer updates the API and bumps `info.version` in the Spring Boot OpenAPI config
2. An ezd-angular developer runs `gen:openapi`, which downloads the new spec
3. The committed `openapi.yaml` now contains the updated `info.version`
4. CI verifies the generated code matches

### Runtime Version Check (Optional)

The backend exposes a `version-info-controller` endpoint. Angular can check at startup whether the spec version matches the running backend:

```typescript
import { inject } from '@angular/core';
import { VersionInfoControllerService } from '@ccms/api';

// On bootstrap or in a root service:
const versionService = inject(VersionInfoControllerService);
versionService.getVersionInfo().subscribe(info => {
  // Compare info.apiVersion against the spec version baked into the build
  // Log a warning on mismatch
});
```

This gives a clear signal if the deployed Angular bundle was built against a different API version than the running backend.

### Cross-Repo Version Verification

For verifying versions across the ezd and ezd-angular repos:

| Where | What to check |
|-------|---------------|
| `ezd-angular/openapi.yaml` | `info.version` — the spec the client was generated from |
| TurboDITA backend at runtime | `/v3/api-docs.yaml` → `info.version` |
| Angular bundle | `VERSION` constant — the build version of ezd-angular |
| ezd `app-server/pom.xml` | `ezd.angular.version` — which ezd-angular release ezd is using |

If the backend's `info.version` doesn't match what's in `openapi.yaml`, the API client may be out of date.

### Future: Automated Spec Sync

If manual sync becomes a bottleneck, you could automate it:

1. **ezd CI publishes the spec** — after the backend builds, upload `openapi.yaml` as a GitHub artifact
2. **Scheduled workflow in ezd-angular** — weekly or on-demand, downloads the latest spec from ezd, regenerates, and opens a PR if there are changes
3. **Webhook trigger** — ezd CI triggers an ezd-angular workflow via `repository_dispatch` when the API changes

```yaml
# In ezd-angular: .github/workflows/sync-api.yml
name: Sync API Spec
on:
  repository_dispatch:
    types: [api-spec-updated]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Download latest spec
        run: |
          gh run download --repo Jorsek/ezd \
            --name openapi-spec \
            --dir /tmp/spec
          cp /tmp/spec/openapi.yaml openapi.yaml
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Regenerate client
        run: |
          npx @openapitools/openapi-generator-cli generate \
            -i openapi.yaml \
            -g typescript-angular \
            -o projects/shared/src/lib/api \
            --additional-properties=ngVersion=21.0.0,providedInRoot=true,fileNaming=kebab-case
      - name: Create PR if changed
        run: |
          if git diff --quiet; then
            echo "No changes detected"
            exit 0
          fi
          BRANCH="auto/api-sync-$(date +%Y%m%d)"
          git checkout -b "$BRANCH"
          git add openapi.yaml projects/shared/src/lib/api/
          git commit -m "Sync API client from latest backend spec"
          git push -u origin "$BRANCH"
          gh pr create \
            --title "Sync API client from backend" \
            --body "Auto-generated from latest TurboDITA OpenAPI spec." \
            --base main
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This is optional and can be added later when the team is ready for fully automated spec syncing.
