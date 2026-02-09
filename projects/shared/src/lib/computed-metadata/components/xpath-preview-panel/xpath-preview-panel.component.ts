import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { FolderPickerComponent, FolderSelectedEvent } from '../../../components/folder-picker';
import { ResourceChipComponent } from '../../../components/resource-chip';
import { extractFolderDisplayName } from '../../../utils/cms-path.util';
import { FolderPreviewItem, isXpathValidationError } from '../../models';
import { ComputedMetadataService } from '../../services';

export interface XpathValidationError {
  xpath: string;
  message: string;
}

/**
 * Live preview panel for XPath expressions.
 * Watches xpaths input and fetches preview results with debouncing.
 */
@Component({
  selector: 'ccms-xpath-preview-panel',
  imports: [FolderPickerComponent, ResourceChipComponent],
  templateUrl: './xpath-preview-panel.component.html',
  styleUrl: './xpath-preview-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XPathPreviewPanelComponent {
  private service = inject(ComputedMetadataService);

  /** XPath expressions to preview */
  xpaths = input<string[]>([]);

  /** Default value to use when no XPath matches */
  defaultValue = input<string>('');

  /** Emitted when an XPath validation error occurs */
  xpathError = output<XpathValidationError>();

  protected folderUuid = signal<string>('');
  protected folderPath = signal<string>('');
  protected folderName = computed(() => extractFolderDisplayName(this.folderPath()));

  protected results = signal<FolderPreviewItem[]>([]);
  protected totalResources = signal<number>(0);
  protected searchedCount = signal<number>(0);
  protected returnedCount = signal<number>(0);
  protected hasMore = signal<boolean>(false);
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  protected hasValidXpaths = computed(() => {
    const xps = this.xpaths();
    return xps.some((x) => x.trim().length > 0);
  });

  protected hasFolderUuid = computed(() => this.folderUuid().length > 0);

  protected canPreview = computed(() => this.hasValidXpaths() && this.hasFolderUuid());

  protected isEmpty = computed(() => this.results().length === 0 && !this.isLoading());

  constructor() {
    combineLatest([
      toObservable(this.xpaths),
      toObservable(this.defaultValue),
      toObservable(this.folderUuid),
    ])
      .pipe(
        debounceTime(250),
        map(([xps, defaultVal, folderId]) => ({
          xpaths: xps.filter((x) => x.trim().length > 0),
          defaultValue: defaultVal,
          folderId,
        })),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(),
      )
      .subscribe(({ xpaths, defaultValue, folderId }) => {
        if (xpaths.length === 0 || !folderId) {
          this.results.set([]);
          this.error.set(null);
          return;
        }
        this.fetchPreview(xpaths, defaultValue, folderId);
      });
  }

  protected onFolderChange(event: FolderSelectedEvent): void {
    this.folderUuid.set(event.uuid);
    this.folderPath.set(event.name);
  }

  private fetchPreview(xpaths: string[], defaultValue: string, folderUuid: string): void {
    this.results.set([]);
    this.totalResources.set(0);
    this.searchedCount.set(0);
    this.returnedCount.set(0);
    this.hasMore.set(false);
    this.isLoading.set(true);
    this.error.set(null);

    this.service
      .previewFolder({
        xpaths,
        defaultValue: defaultValue || undefined,
        folderUuid,
        limit: 50,
        recursive: true,
      })
      .subscribe({
        next: (event) => {
          if (event.type === 'start') {
            this.totalResources.set(event.data.totalResources);
          } else if (event.type === 'progress') {
            this.searchedCount.set(event.data.searched);
          } else if (event.type === 'item') {
            this.results.update((items) => [...items, event.data]);
          } else if (event.type === 'complete') {
            this.returnedCount.set(event.data.returned);
            this.hasMore.set(event.data.hasMore);
            this.isLoading.set(false);
          }
        },
        error: (err: unknown) => {
          this.isLoading.set(false);
          if (isXpathValidationError(err)) {
            this.xpathError.emit({
              xpath: err.error.xpath,
              message: err.error.detail,
            });
            this.error.set(null);
          } else {
            const httpError = err as { error?: { detail?: string }; message?: string };
            const errorMessage =
              httpError.error?.detail || httpError.message || 'Failed to fetch preview';
            this.error.set(errorMessage);
          }
        },
      });
  }
}
