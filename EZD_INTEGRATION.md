# Integrating ezd-angular into ezd

## Current Flow

The ezd build currently builds the Angular components inline:

1. Runs `ccms-components/build.sh` which calls `npm run build:shared && npm run build:elements`
2. Angular output goes to `app-server/server/webapps/ezd-nxtgen/ccms-components/browser/` (configured via `angular.json` `outputPath`)
3. `PublicAssetResourceImpl.java` finds the hashed files (`main-{HASH}.js`, `styles-{HASH}.css`) in that directory and generates a dynamic loader script served at `/ezdnxtgen/api/assets/ccms-component-loader.js`
4. `ezd.html` loads that script, which injects `<script>` and `<link>` tags for the bundle
5. Maven packages everything into `ezd-installer.sh`

### Key Files in ezd

| File | Role |
|------|------|
| `app-server/server/webapps/ezd-nxtgen/ezd.html` | Loads `ccms-component-loader.js` |
| `backends/exist/exist-ezd-endpoints/.../PublicAssetResourceImpl.java` | Generates loader script, finds hashed bundle files on disk |
| `.github/workflows/build_release.yml` | Builds ccms-components as part of the release |
| `.github/workflows/build_qa_installers.yml` | Builds ccms-components as part of QA |

### How the Loader Works

In **dev mode** (`JCMUtil.isSystemInDevelopmentMode()`):
- Points to `http://localhost:4200/main.js` and `http://localhost:4200/styles.css`

In **production**:
- Scans `exist.home/webapps/ezd-nxtgen/ccms-components/browser/` for `main-*.js` and `styles-*.css`
- Generates a loader script that injects those files into the DOM

## Switching to GitHub Release Artifacts

No Java code changes required. Replace the inline Angular build step in the ezd CI workflows with a download from an ezd-angular release.

### 1. Pin the version in ezd

Create a file `.ezd-angular-version` in the ezd repo root:

```
0.1.0
```

### 2. Update the ezd build workflows

Replace the `ccms-components/build.sh` step in `build_release.yml` and `build_qa_installers.yml`:

```yaml
- name: Download ezd-angular release
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    VERSION=$(cat .ezd-angular-version)
    gh release download "v${VERSION}" \
      --repo Jorsek/ezd-angular \
      --pattern 'ezd-angular-*.tar.gz' \
      --dir /tmp
    mkdir -p app-server/server/webapps/ezd-nxtgen/ccms-components
    tar -xzf /tmp/ezd-angular-*.tar.gz \
      -C app-server/server/webapps/ezd-nxtgen/ccms-components
```

The rest of the ezd build (Maven package, installer creation) stays the same — it just picks up the pre-built files from that directory.

### 3. Updating the Angular version

To bump the Angular version used by ezd:

1. Create a new release in ezd-angular (`git tag v0.2.0 && git push --tags`)
2. Update `.ezd-angular-version` in ezd to `0.2.0`
3. Open a PR in ezd — CI will download and build with the new version

### 4. Release branch workflow (optional)

For more control, use a dedicated branch pattern in ezd:

```
release/angular-v1.0  →  .ezd-angular-version contains "1.0.0"
release/angular-v1.1  →  .ezd-angular-version contains "1.1.0"
```

Merging these branches into the main ezd branch bumps the Angular dependency in a trackable, reviewable way.

## Development Mode

Local development doesn't change. Developers still:

1. Run `npm run watch` in ezd-angular (serves at `localhost:4200`)
2. Start ezd normally
3. The loader script points to `localhost:4200` in dev mode

The GitHub Release integration only affects CI/CD builds and production deployments.
