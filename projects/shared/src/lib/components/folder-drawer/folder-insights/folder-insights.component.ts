import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs/operators';
import { ContentInsightsControllerService } from '@ccms/api/api/content-insights-controller.service';
import { Context as ApiContext, InsightsSummaryRequest } from '@ccms/api/model/models';
import { ContentInsightsSummaries } from '../../../services/content-report.service';
import { FolderInsightsDisplayComponent } from '../folder-insights-display/folder-insights-display.component';
import { SkeletonComponent } from '@ccms/components/reporting/skeleton/skeleton';

@Component({
  selector: 'ccms-folder-insights',
  templateUrl: './folder-insights.component.html',
  styleUrl: './folder-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FolderInsightsDisplayComponent, SkeletonComponent],
})
export class FolderInsightsComponent {
  folderUuid = input<string>();
  mapUuid = input<string>();
  branchName = input<string>();

  private api = inject(ContentInsightsControllerService);
  private destroyRef = inject(DestroyRef);

  protected isLoading = signal(false);
  protected error = signal<string | null>(null);
  protected data = signal<ContentInsightsSummaries>({ callouts: {}, summaries: {} });

  /** Computed context from inputs */
  private context = computed<ApiContext | null>(() => {
    if (this.branchName()) {
      return { type: ApiContext.TypeEnum.Branch, id: this.branchName()! };
    }
    if (this.mapUuid()) {
      return { type: ApiContext.TypeEnum.Map, id: this.mapUuid()! };
    }
    if (this.folderUuid()) {
      return { type: ApiContext.TypeEnum.Folder, id: this.folderUuid()! };
    }
    return null;
  });

  constructor() {
    effect(() => {
      const context = this.context();
      if (context) {
        untracked(() => this.loadInsights(context));
      }
    });
  }

  private loadInsights(context: ApiContext): void {
    this.isLoading.set(true);
    this.error.set(null);

    const request: InsightsSummaryRequest = {
      context,
      callouts: ['TOTAL_WORDS', 'TOTAL_OBJECTS', 'TOTAL_FOLDERS'],
      summaries: {
        content_type: {
          type: 'OBJECTS',
          field: 'contentType',
          limit: 10,
        },
      },
    };

    this.api
      .getSummary2(request)
      .pipe(retry(3), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.isLoading.set(false);
          this.data.set({
            callouts: resp.callouts ?? {},
            summaries: (resp.summaries ?? {}) as ContentInsightsSummaries['summaries'],
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.message || 'Failed to load content insights');
          this.data.set({ callouts: {}, summaries: {} });
        },
      });
  }
}
