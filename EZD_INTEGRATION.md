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

No Java code changes required. Replace the inline Angular build with a Maven download from an ezd-angular release.

### How Releases Work

Every merge to `main` in ezd-angular automatically creates:

1. **A dated release** (e.g., `v2025-02-09-1`, `v2025-02-09-2`) — permanent, immutable
2. **A `latest` release** — always points to the most recent build on main

You can also create manual releases by pushing a tag (`git tag v1.0.0 && git push --tags`).

### Release Asset URLs

GitHub release assets have direct download URLs that Maven can fetch without any extra tooling:

```
# Latest (always the newest build)
https://github.com/Jorsek/ezd-angular/releases/latest/download/ezd-angular-latest.tar.gz

# Specific version
https://github.com/Jorsek/ezd-angular/releases/download/v2025-02-09-1/ezd-angular-2025-02-09-1.tar.gz
```

## Maven Integration (Local + CI Builds)

Add the following to `app-server/pom.xml`. This replaces `ccms-components/build.sh` — no Node.js or npm needed for ezd builds.

### 1. Add properties to `app-server/pom.xml`

```xml
<properties>
  <!-- Integration branch: use "latest" -->
  <ezd.angular.version>latest</ezd.angular.version>
  <ezd.angular.url>https://github.com/Jorsek/ezd-angular/releases/latest/download/ezd-angular-latest.tar.gz</ezd.angular.url>
</properties>
```

On a **release branch**, override to pin a specific version:

```xml
<properties>
  <ezd.angular.version>2025-02-09-1</ezd.angular.version>
  <ezd.angular.url>https://github.com/Jorsek/ezd-angular/releases/download/v${ezd.angular.version}/ezd-angular-${ezd.angular.version}.tar.gz</ezd.angular.url>
</properties>
```

### 2. Add the download plugin to `app-server/pom.xml`

Uses `maven-antrun-plugin` (already in the project) to download and extract the release artifact during `generate-resources`, before GWT compile and packaging:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-antrun-plugin</artifactId>
  <executions>
    <execution>
      <id>download-angular</id>
      <phase>generate-resources</phase>
      <goals><goal>run</goal></goals>
      <configuration>
        <target>
          <mkdir dir="${server.dir}/webapps/ezd-nxtgen/ccms-components"/>
          <get src="${ezd.angular.url}"
               dest="${project.build.directory}/ezd-angular.tar.gz"
               skipexisting="false"/>
          <untar src="${project.build.directory}/ezd-angular.tar.gz"
                 dest="${server.dir}/webapps/ezd-nxtgen/ccms-components"
                 compression="gzip"/>
        </target>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### 3. Remove `ccms-components/build.sh` from CI workflows

In `build_release.yml` and `build_qa_installers.yml`, remove the steps that run `ccms-components/build.sh`. Maven now handles the Angular artifacts automatically.

The Node.js setup steps in those workflows can also be removed since npm is no longer needed for the ezd build.

### What This Gives You

| Scenario | What happens |
|----------|-------------|
| `mvn package` on integration branch | Downloads latest Angular build from GitHub |
| `mvn package` on release branch | Downloads pinned version from GitHub |
| Local dev (Angular developer) | `npm run watch` in ezd-angular, loader uses localhost:4200 |
| Local dev (non-Angular developer) | `mvn package` downloads pre-built artifacts, no Node.js needed |

## GitHub Actions CI (Alternative)

If you prefer to keep the download in the workflow YAML rather than Maven (e.g., for caching or visibility), you can use these steps instead.

### Integration Branch (always use latest)

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

### Release Branch (pin a specific version)

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

## Typical Workflow

```
ezd-angular main ──▸ auto-releases: v2025-02-09-1, v2025-02-09-2, v2025-02-10-1, ...
                       └── "latest" always points to newest

ezd integration branch ──▸ Maven downloads "latest" on every build
ezd release branch     ──▸ Maven downloads pinned version (e.g., "2025-02-09-2")
```

1. Develop Angular components, merge PRs to ezd-angular main
2. Each merge auto-creates a dated release + updates `latest`
3. Integration branch in ezd automatically picks up every new build via Maven
4. When ready to cut a release, note the current version (e.g., `v2025-02-10-1`)
5. Set `ezd.angular.version` property to `2025-02-10-1` on the ezd release branch
6. That version is locked for the release — no surprises from newer Angular changes

### Bumping the Pinned Version

To update the Angular version on a release branch:

1. Check available releases: `gh release list --repo Jorsek/ezd-angular`
2. Update `ezd.angular.version` and `ezd.angular.url` in `app-server/pom.xml`
3. Open a PR in ezd — Maven will download and build with that version

## Development Mode

Local development doesn't change. Developers still:

1. Run `npm run watch` in ezd-angular (serves at `localhost:4200`)
2. Start ezd normally
3. The loader script points to `localhost:4200` in dev mode

Developers not working on Angular don't need Node.js at all — `mvn package` handles everything.
