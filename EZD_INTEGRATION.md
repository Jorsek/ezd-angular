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

### How Releases Work

Every merge to `main` in ezd-angular automatically creates:

1. **A dated release** (e.g., `v2025-02-09-1`, `v2025-02-09-2`) — permanent, immutable
2. **A `latest` release** — always points to the most recent build on main

You can also create manual releases by pushing a tag (`git tag v1.0.0 && git push --tags`).

### Integration Branch (always use latest)

On the ezd integration/development branch, always pull the latest Angular build:

```yaml
- name: Download latest ezd-angular
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release download latest \
      --repo Jorsek/ezd-angular \
      --pattern 'ezd-angular-latest.tar.gz' \
      --dir /tmp
    mkdir -p app-server/server/webapps/ezd-nxtgen/ccms-components
    tar -xzf /tmp/ezd-angular-latest.tar.gz \
      -C app-server/server/webapps/ezd-nxtgen/ccms-components
```

This ensures the integration branch always builds with the newest Angular components.

### Release Branch (pin a specific version)

For release branches, pin to a known-good version using `.ezd-angular-version`:

1. Create `.ezd-angular-version` in the ezd repo root:

```
2025-02-09-1
```

2. Use this workflow step:

```yaml
- name: Download pinned ezd-angular
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

### Typical Workflow

```
ezd-angular main ──▸ auto-releases: v2025-02-09-1, v2025-02-09-2, v2025-02-10-1, ...
                       └── "latest" always points to newest

ezd integration branch ──▸ downloads "latest" on every build
ezd release branch     ──▸ .ezd-angular-version = "2025-02-09-2" (pinned)
```

1. Develop Angular components, merge PRs to ezd-angular main
2. Integration branch in ezd automatically picks up every new build
3. When ready to cut a release, note the current version (e.g., `v2025-02-10-1`)
4. Set `.ezd-angular-version` to `2025-02-10-1` on the ezd release branch
5. That version is locked for the release — no surprises from newer Angular changes

### Bumping the Pinned Version

To update the Angular version on a release branch:

1. Check available releases: `gh release list --repo Jorsek/ezd-angular`
2. Update `.ezd-angular-version` to the desired version
3. Open a PR in ezd — CI will download and build with that version

## Development Mode

Local development doesn't change. Developers still:

1. Run `npm run watch` in ezd-angular (serves at `localhost:4200`)
2. Start ezd normally
3. The loader script points to `localhost:4200` in dev mode

The GitHub Release integration only affects CI/CD builds and production deployments.
