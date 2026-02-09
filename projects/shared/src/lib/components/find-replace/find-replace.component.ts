import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FindReplaceService } from '../../services/find-replace/find-replace.service';
import {
  ResourceFindRequest,
  SearchContext,
  ContentType,
  FileMatches,
  FindError,
} from '../../services/find-replace/models';
import {
  FindCriteriaFormComponent,
  SearchScopeSelectorComponent,
  SearchProgressComponent,
  SearchResultsComponent,
} from './index';
import { Validators } from '../../utils/validators.util';
import { downloadBlob } from '../../utils/file-download.util';

/**
 * Find/Replace Component - Main container component
 *
 * Smart component that coordinates sub-components and manages search state
 * Delegates UI rendering to specialized sub-components
 *
 * Accepts optional initial values to pre-populate the search scope:
 * - initialResourceUuid: Pre-select a specific resource
 * - initialDirectoryUuid: Pre-select a directory
 * - initialContextType: The context type to use
 * - initialExplicitOnly: For resource dependencies, only search explicit deps
 *
 */
@Component({
  selector: 'ccms-find-replace',
  templateUrl: './find-replace.component.html',
  styleUrl: './find-replace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FindCriteriaFormComponent,
    SearchScopeSelectorComponent,
    SearchProgressComponent,
    SearchResultsComponent,
  ],
})
export class FindReplaceComponent implements OnDestroy {
  private findReplaceService = inject(FindReplaceService);
  private searchSubscription: Subscription | null = null;

  // ========== Initial Value Inputs (from parent/GWT) ==========

  initialResourceUuid = input<string>('');
  initialDirectoryUuid = input<string>('');
  initialContextType = input<SearchContext['type']>('SINGLE_RESOURCE');
  initialExplicitOnly = input<boolean>(false);

  // ========== Search Form State ==========

  protected searchPattern = signal('');
  protected useRegex = signal(false);
  protected caseSensitive = signal(false);
  protected wholeWordsOnly = signal(false);
  protected ignoreWhitespace = signal(false);
  protected contentTypes = signal<ContentType[]>([]);
  protected xpathRestriction = signal('');

  // ========== Scope/Context State ==========

  protected contextType = signal<SearchContext['type']>('SINGLE_RESOURCE');
  protected resourceUuid = signal('');
  protected directoryUuid = signal('');
  protected recursive = signal(false);
  protected explicitOnly = signal(false);

  // ========== Replace Form State ==========

  protected replaceText = signal('');
  protected replaceEnabled = signal(false);

  // ========== Search Execution State ==========

  protected isSearching = signal(false);
  protected isDownloadingCsv = signal(false);
  protected matchesByFile = signal<Map<string, FileMatches>>(new Map());
  protected expandedFiles = signal<Set<string>>(new Set());
  protected errorMessage = signal<string | null>(null);
  protected thresholdExceeded = signal(false);
  protected csvEndpoint = signal<string | null>(null);
  protected durationMs = signal(0);
  protected resourcesProcessed = signal(0);
  protected totalResources = signal(0);

  // ========== Computed ==========

  protected isPatternValid = computed(() => this.searchPattern().trim().length > 0);

  protected isContextValid = computed(() => {
    const ctxType = this.contextType();
    if (ctxType === 'SINGLE_RESOURCE' || ctxType === 'RESOURCE_WITH_DEPENDENCIES') {
      return Validators.isValidUuid(this.resourceUuid());
    } else if (ctxType === 'DIRECTORY_SCOPE') {
      return Validators.isValidUuid(this.directoryUuid());
    }
    return false;
  });

  protected isFormValid = computed(() => this.isPatternValid() && this.isContextValid());

  protected resourcesWithMatches = computed(() => this.matchesByFile().size);

  protected totalMatches = computed(() => {
    let total = 0;
    for (const fileMatch of this.matchesByFile().values()) {
      total += fileMatch.matches.length;
    }
    return total;
  });

  protected fileMatchesList = computed(() => Array.from(this.matchesByFile().values()));

  // ========== Initialization ==========

  constructor() {
    // Initialize signals from inputs when they are provided
    // This runs once when inputs are first available
    effect(() => {
      const resourceUuid = this.initialResourceUuid();
      const directoryUuid = this.initialDirectoryUuid();
      const contextType = this.initialContextType();
      const explicitOnly = this.initialExplicitOnly();

      // Only initialize if values are provided (non-empty)
      if (resourceUuid) {
        this.resourceUuid.set(resourceUuid);
        this.contextType.set(contextType);
        this.explicitOnly.set(explicitOnly);
      } else if (directoryUuid) {
        this.directoryUuid.set(directoryUuid);
        this.contextType.set(contextType);
        // Default recursive to true for directory scope
        this.recursive.set(true);
      }
    });
  }

  // ========== Event Handlers ==========

  protected onToggleFileExpansion(uuid: string): void {
    this.expandedFiles.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  }

  protected onExpandAll(): void {
    const allUuids = new Set(this.matchesByFile().keys());
    this.expandedFiles.set(allUuids);
  }

  protected onCollapseAll(): void {
    this.expandedFiles.set(new Set());
  }

  // ========== Actions ==========

  protected executeFindAll(): void {
    if (!this.isFormValid()) {
      this.errorMessage.set('Please fix validation errors before searching');
      return;
    }

    this.resetSearchState();
    this.isSearching.set(true);

    const request = this.buildSearchRequest();

    this.searchSubscription = this.findReplaceService.executeFind(request).subscribe({
      next: (event) => {
        switch (event.type) {
          case 'task-started':
            this.totalResources.set(event.data.totalResources);
            break;

          case 'file-matches':
            this.matchesByFile.update((map) => {
              const newMap = new Map(map);
              newMap.set(event.data.resource.uuid, event.data);
              return newMap;
            });
            this.expandedFiles.update((set) => {
              const newSet = new Set(set);
              newSet.add(event.data.resource.uuid);
              return newSet;
            });
            break;

          case 'progress':
            this.resourcesProcessed.set(event.data.resourcesProcessed);
            this.totalResources.set(event.data.totalResources);
            break;

          case 'find-completed':
            this.isSearching.set(false);
            this.durationMs.set(event.data.durationMs);
            this.resourcesProcessed.set(event.data.totalResources);
            this.totalResources.set(event.data.totalResources);
            break;

          case 'error':
            this.handleSearchError(event.data);
            break;
        }
      },
      error: (error) => {
        this.isSearching.set(false);
        if (error.type === 'error') {
          this.handleSearchError(error.data);
        } else {
          this.errorMessage.set('Search failed: ' + error.message);
        }
      },
      complete: () => {
        this.isSearching.set(false);
      },
    });
  }

  protected stopSearch(): void {
    // Unsubscribing automatically aborts the fetch request via finalize()
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
      this.searchSubscription = null;
    }

    this.isSearching.set(false);
  }

  protected cancel(): void {
    this.stopSearch();
  }

  protected replaceAll(): void {
    console.warn('Replace functionality not yet implemented');
  }

  protected downloadCsv(): void {
    if (this.isDownloadingCsv()) {
      return;
    }

    this.isDownloadingCsv.set(true);
    this.errorMessage.set(null);
    const request = this.buildSearchRequest();

    this.findReplaceService.downloadCsv(request).subscribe({
      next: (blob) => {
        const filename = `find-results-${new Date().toISOString().slice(0, 10)}.csv`;
        downloadBlob(blob, filename);
        this.isDownloadingCsv.set(false);
      },
      error: (error) => {
        this.errorMessage.set('CSV download failed: ' + error.message);
        this.isDownloadingCsv.set(false);
      },
    });
  }

  // ========== Private Methods ==========

  private resetSearchState(): void {
    this.matchesByFile.set(new Map());
    this.expandedFiles.set(new Set());
    this.errorMessage.set(null);
    this.thresholdExceeded.set(false);
    this.csvEndpoint.set(null);
    this.durationMs.set(0);
    this.resourcesProcessed.set(0);
    this.totalResources.set(0);
  }

  private buildSearchRequest(): ResourceFindRequest {
    return this.findReplaceService.buildSearchRequest(
      {
        pattern: this.searchPattern(),
        useRegex: this.useRegex(),
        caseSensitive: this.caseSensitive(),
        wholeWordsOnly: this.wholeWordsOnly(),
        ignoreWhitespace: this.ignoreWhitespace(),
        contentTypes: this.contentTypes(),
        xpathRestriction: this.xpathRestriction(),
      },
      {
        contextType: this.contextType(),
        resourceUuid: this.resourceUuid(),
        directoryUuid: this.directoryUuid(),
        recursive: this.recursive(),
        explicitOnly: this.explicitOnly(),
      },
    );
  }

  private handleSearchError(error: FindError): void {
    this.isSearching.set(false);

    if (error.status === 400 && error.message?.includes('RESULT_SET_TOO_LARGE')) {
      this.thresholdExceeded.set(true);
      this.csvEndpoint.set(error.csvEndpoint || null);
      this.errorMessage.set(
        `Found ${error.matchesFound} matches (limit: ${error.threshold}). ` +
          `Use the Download CSV button to get complete results.`,
      );
    } else {
      this.errorMessage.set(`Search failed: ${error.message}`);
    }
  }

  // ========== Lifecycle ==========

  ngOnDestroy(): void {
    // Unsubscribing automatically aborts the fetch request via finalize()
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
