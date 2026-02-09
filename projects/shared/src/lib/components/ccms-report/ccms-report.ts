import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertBannerComponent } from '../alert-banner/alert-banner';
import { PopupOutletComponent, PopupService } from '../ccms-popup';
import { NotificationService } from '../ccms-notifications';
import {
  CurrentViewService,
  InsightsType,
  InsightsView,
  InsightsViewRequest,
  ViewSectionComponent,
  ViewsService,
} from '../insights-views';

/**
 * Shared report component that provides common infrastructure for all insight reports.
 *
 * Handles:
 * - View management (fetching, merging, sorting)
 * - View persistence (save, update, delete)
 * - Session storage for last viewed view
 * - Provides PopupService to children
 *
 * The parent component must provide its CurrentViewService instance as an input.
 *
 * Usage:
 * ```html
 * <ccms-report
 *   [insightType]="'CONTENT'"
 *   [defaultViews]="[DEFAULT_VIEW]"
 *   [currentViewService]="currentViewService"
 * >
 *   <ccms-filter-section ... />
 *   <ccms-chart-list ... />
 *   <ccms-table ... />
 * </ccms-report>
 * ```
 */
@Component({
  selector: 'ccms-report',
  templateUrl: './ccms-report.html',
  styleUrl: './ccms-report.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PopupService],
  imports: [AlertBannerComponent, ViewSectionComponent, PopupOutletComponent],
})
export class CcmsReportComponent implements OnInit, OnDestroy {
  /** The type of insight report (required for view management) */
  insightType = input<InsightsType>();

  /** Default/built-in views for this report type */
  defaultViews = input<InsightsView[]>([]);

  /** Whether users can create/manage custom views */
  allowUserViews = input<boolean>(true);

  /** CurrentViewService instance from the parent component */
  currentViewService = input<CurrentViewService>();

  /** Optional report title displayed in the header */
  title = input<string>();

  /** Optional report description displayed below the title */
  description = input<string>();

  /** Whether to show the header section (defaults to false) */
  showHeader = input<boolean>(false);

  /** Whether to show the loading overlay */
  loading = input<boolean>(false);

  /** External errors passed from parent component */
  errors = input<string[]>([]);

  /** Emitted when retry button is clicked on the error banner */
  retry = output<void>();

  /** Maximum number of error messages to display */
  private static readonly MAX_ERROR_MESSAGES = 3;

  /** All error messages to display (merges external errors with internal viewsError, capped at MAX_ERROR_MESSAGES) */
  protected errorMessages = computed(() => {
    const messages: string[] = [...this.errors()];
    const viewsErr = this.viewsError();
    if (viewsErr) messages.push(viewsErr);
    // Show only the most recent errors to avoid overwhelming the UI
    return messages.slice(-CcmsReportComponent.MAX_ERROR_MESSAGES);
  });

  /** Whether to show the error banner */
  protected hasErrors = computed(() => this.errorMessages().length > 0);

  /** Loading message - uses title if provided, otherwise generic message */
  protected loadingMessage = computed(() => {
    const title = this.title();
    return title ? `Loading ${title}...` : 'Loading report...';
  });

  /** Whether to show the header (showHeader is true and has title or description) */
  protected hasHeader = computed(() => {
    if (!this.showHeader()) return false;
    const title = this.title();
    const description = this.description();
    return (
      (title !== undefined && title.length > 0) ||
      (description !== undefined && description.length > 0)
    );
  });

  /** Whether view management is enabled (has insightType and currentViewService) */
  protected hasViewManagement = computed(() => {
    return this.insightType() !== undefined && this.currentViewService() !== undefined;
  });

  private viewsService = inject(ViewsService);
  private notificationService = inject(NotificationService, { optional: true });
  private destroyRef = inject(DestroyRef);

  /** Error from fetching views */
  protected viewsError = signal<string | null>(null);

  /** User views fetched from the API */
  private apiViews = signal<InsightsView[]>([]);

  /** Minimum display time (ms) for loading overlay to prevent flickering */
  private static readonly MIN_LOADING_DISPLAY_MS = 250;

  /** Extended loading state - stays true for minimum display time */
  private extendedLoading = signal(false);

  /** Timeout ID for minimum display timer */
  private loadingTimeoutId?: ReturnType<typeof setTimeout>;

  /** Combined loading state - true if actually loading OR within minimum display window */
  protected isLoading = computed(() => this.loading() || this.extendedLoading());

  /** All views: default + API views, sorted by readOnly (true first) then name */
  protected allViews = computed(() => {
    const defaults = this.defaultViews();
    const api = this.apiViews();
    const defaultIds = new Set(defaults.map((v) => v.id));

    return [...defaults, ...api.filter((v) => !defaultIds.has(v.id))].sort((a, b) => {
      if (a.readOnly !== b.readOnly) return a.readOnly ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  });

  constructor() {
    // Save view ID to session storage when view changes
    // Only runs after viewReady is true (initial view has been set)
    effect(() => {
      const type = this.insightType();
      const service = this.currentViewService();

      if (type && service?.viewReady()) {
        const viewId = service.view().id;
        console.log('[Views] Saving view ID:', viewId);
        this.viewsService.saveLastViewId(type, viewId);
      }
    });

    // Track loading transitions to enforce minimum display time
    let wasLoading = false;
    effect(() => {
      const actuallyLoading = this.loading();

      if (actuallyLoading && !wasLoading) {
        // Transition to loading state - start minimum display timer
        this.extendedLoading.set(true);

        if (this.loadingTimeoutId) {
          clearTimeout(this.loadingTimeoutId);
        }

        this.loadingTimeoutId = setTimeout(() => {
          this.extendedLoading.set(false);
        }, CcmsReportComponent.MIN_LOADING_DISPLAY_MS);
      }

      wasLoading = actuallyLoading;
    });
  }

  ngOnDestroy(): void {
    if (this.loadingTimeoutId) {
      clearTimeout(this.loadingTimeoutId);
    }
  }

  ngOnInit(): void {
    const type = this.insightType();
    if (type) {
      this.viewsService
        .get(type)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (apiViews) => {
            this.apiViews.set(apiViews);
            this.setInitialView(type);
          },
          error: (e) => {
            this.viewsError.set(e.error ?? 'Unable to retrieve the current views');
            // Still set initial view with just default views
            this.setInitialView(type);
          },
        });
    }
    // No view management case: viewReady from currentViewService handles gating
  }

  /**
   * Set the initial view - either restored from session storage or the default view.
   * Called after API views are loaded (or failed to load).
   * viewReady signal is set automatically when service.setView() is called.
   */
  private setInitialView(type: InsightsType): void {
    const service = this.currentViewService();
    if (!service) {
      console.log('[Views] setInitialView: no currentViewService');
      return;
    }

    // Combine default views with API views
    const allViews = this.allViews();
    if (allViews.length === 0) {
      console.log('[Views] setInitialView: no views available');
      return;
    }

    // Configure service with available views
    service.configure(type, allViews);

    // Try to restore saved view, otherwise use first view (default)
    const savedViewId = this.viewsService.getLastViewId(type);
    const savedView = savedViewId ? allViews.find((v) => v.id === savedViewId) : undefined;
    const initialView = savedView ?? allViews[0];

    console.log(
      '[Views] setInitialView:',
      initialView.name,
      savedView ? '(restored)' : '(default)',
    );
    service.setView(initialView);
  }

  /** Retry fetching views after an error */
  protected retryFetchViews(): void {
    const type = this.insightType();
    if (!type) return;

    this.viewsError.set(null);
    this.viewsService
      .refresh(type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (views) => this.apiViews.set(views),
        error: (e) => this.viewsError.set(e.error ?? 'Unable to retrieve the current views'),
      });
  }

  protected onViewChange(view: InsightsView): void {
    const service = this.currentViewService();
    if (!service) return;
    console.log('[Views] onViewChange:', view.name, view.id);
    service.setView(view);
  }

  protected onSaveView(request: Omit<InsightsViewRequest, 'id'>): void {
    const type = this.insightType();
    const service = this.currentViewService();
    if (!type || !service) return;

    this.viewsService.add(type, request).subscribe({
      next: (savedView) => {
        // Add to local cache if not already present (ViewsService.add also updates its cache)
        this.apiViews.update((views) => {
          if (views.some((v) => v.id === savedView.id)) {
            return views; // Already added by ViewsService cache update
          }
          return [...views, savedView];
        });
        // Re-configure service with updated views list, then set the new view as current
        console.log('[Views] onSaveView: setting new view as current:', savedView.name);
        service.configure(type, this.allViews());
        service.setView(savedView);
        this.notificationService?.success(`View "${request.name}" created`);
      },
      error: () => {
        this.notificationService?.error(`Failed to create view "${request.name}"`, () =>
          this.onSaveView(request),
        );
      },
    });
  }

  protected onUpdateView(request: InsightsViewRequest): void {
    const type = this.insightType();
    const service = this.currentViewService();
    if (!request.id || !type || !service) return;

    // Check if view is read-only (backend will reject anyway)
    const currentView = service.view();
    if (currentView.readOnly) {
      console.warn('[Views] Attempted to update read-only view:', currentView.name);
      return;
    }

    this.viewsService.update(type, request).subscribe({
      next: (updatedView) => {
        // Update local cache with the updated view
        this.apiViews.update((views) =>
          views.map((v) => (v.id === updatedView.id ? updatedView : v)),
        );
        // Re-configure service with updated views list
        service.configure(type, this.allViews());
        service.markSaved(updatedView);
        this.notificationService?.success(`View "${request.name}" updated`);
      },
      error: () => {
        this.notificationService?.error(`Failed to update view "${request.name}"`, () =>
          this.onUpdateView(request),
        );
      },
    });
  }

  protected onDeleteView(viewId: string): void {
    const type = this.insightType();
    const service = this.currentViewService();
    if (!type || !service) return;

    // Find the view being deleted to get its name and check readOnly
    const viewToDelete = this.allViews().find((v) => v.id === viewId);
    if (!viewToDelete) {
      console.warn('[Views] Attempted to delete unknown view:', viewId);
      return;
    }

    if (viewToDelete.readOnly) {
      console.warn('[Views] Attempted to delete read-only view:', viewToDelete.name);
      return;
    }

    const isCurrentView = service.view().id === viewId;

    this.viewsService.remove(type, viewId).subscribe({
      next: () => {
        // Remove from local cache
        this.apiViews.update((views) => views.filter((v) => v.id !== viewId));
        // Only reset to default if we deleted the current view
        if (isCurrentView) {
          console.log('[Views] onDeleteView: deleted current view, resetting to default');
          service.configure(type, this.allViews());
          service.reset();
        } else {
          console.log('[Views] onDeleteView: deleted non-current view, no change needed');
          service.configure(type, this.allViews());
        }
        this.notificationService?.success(`View "${viewToDelete.name}" deleted`);
      },
      error: () => {
        this.notificationService?.error(`Failed to delete view "${viewToDelete.name}"`, () =>
          this.onDeleteView(viewId),
        );
      },
    });
  }

  protected onRetry(): void {
    this.retryFetchViews();
    this.retry.emit();
  }
}
