import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { PopupService, PopupOutletComponent } from '../../ccms-popup';
import { CurrentViewService } from '../current-view.service';
import { InsightsType, InsightsViewRequest, InsightsView } from '../insights-views.models';
import {
  SaveViewDialogComponent,
  SaveViewDialogData,
  SaveViewDialogResult,
} from '../save-view-dialog/save-view-dialog.component';
import { ViewActionsComponent } from '../view-actions/view-actions.component';
import { ViewDescription, ViewMenuComponent } from '../view-menu/view-menu.component';

/**
 * View Section Component
 *
 * Container component that combines the view menu and view actions.
 * Accepts views and insightType as inputs and configures CurrentViewService.
 * Emits events for parent to handle persistence.
 */
@Component({
  selector: 'ccms-view-section',
  templateUrl: './view-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ViewActionsComponent, ViewMenuComponent, PopupOutletComponent],
  providers: [PopupService],
  styles: [
    `
      .ccms-view-section {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
      }
    `,
  ],
})
export class ViewSectionComponent {
  private popupService = inject(PopupService);

  /** CurrentViewService injected from parent component */
  protected currentViewService = inject(CurrentViewService);

  /** All available views (sorted, with default first) */
  views = input.required<InsightsView[]>();

  /** The insight type for this view section */
  insightType = input.required<InsightsType>();

  /** Whether to allow creating/managing user views */
  allowUserViews = input<boolean>(true);

  /** Emitted when user selects a different view */
  viewChange = output<InsightsView>();

  /** Emitted when user wants to save a new view */
  saveView = output<Omit<InsightsViewRequest, 'id'>>();

  /** Emitted when user wants to update an existing view */
  updateView = output<InsightsViewRequest>();

  /** Emitted when user wants to delete a view */
  deleteView = output<string>();

  protected loading = computed(() => !this.currentViewService.initialized());
  protected error = signal(false);

  /** Map of view ID to full view for quick lookup */
  private viewsMap = computed(() => {
    const map = new Map<string, InsightsView>();
    for (const view of this.views()) {
      map.set(view.id, view);
    }
    return map;
  });

  /** View descriptions for the menu */
  protected viewDescriptions = computed<ViewDescription[]>(() =>
    this.views().map((view) => ({
      id: view.id,
      name: view.name,
      description: view.description ?? '',
    })),
  );

  protected selectedViewDescription = computed(() => {
    if (!this.currentViewService.initialized()) {
      return { id: '', name: '', description: '' };
    }
    const view = this.currentViewService.view();
    return {
      id: view.id,
      name: view.name,
      description: view.description ?? '',
    };
  });

  protected viewEditable = computed(() => {
    if (!this.currentViewService.initialized()) {
      return false;
    }
    const view = this.currentViewService.view();
    return !view.readOnly;
  });

  /** Whether to show the view section UI (hide if only one view) */
  protected showViewSection = computed(() => this.views().length > 1 || this.allowUserViews());

  // Note: No constructor effect needed - ccms-report handles:
  // - configure() when views load
  // - setView() for initial view
  // - All view changes (selection, create, delete)

  protected onViewChange(viewDesc: ViewDescription): void {
    const fullView = this.viewsMap().get(viewDesc.id);
    if (fullView) {
      this.viewChange.emit(fullView);
    }
  }

  protected onUpdateView(): void {
    const view = this.currentViewService.view();
    if (view.readOnly) {
      return;
    }

    this.updateView.emit({
      id: view.id,
      name: view.name,
      description: view.description,
      shared: view.shared,
      columns: this.currentViewService.columns(),
      filters: this.currentViewService.filters(),
      sorts: this.currentViewService.sorts(),
      charts: this.currentViewService.charts(),
      callouts: this.currentViewService.callouts(),
    });
  }

  protected onCreateView(): void {
    const data: SaveViewDialogData = {
      insightType: this.insightType(),
    };
    this.popupService.open<SaveViewDialogComponent, SaveViewDialogData, SaveViewDialogResult>(
      SaveViewDialogComponent,
      data,
      (result) => {
        if (result?.action === 'save' && result.name) {
          const request: Omit<InsightsViewRequest, 'id'> = {
            name: result.name,
            description: result.description,
            shared: false,
            columns: this.currentViewService.columns(),
            filters: this.currentViewService.filters(),
            sorts: this.currentViewService.sorts(),
            charts: this.currentViewService.charts(),
            callouts: this.currentViewService.callouts(),
          };
          this.saveView.emit(request);
        }
      },
    );
  }

  protected onEditView(_viewDesc: ViewDescription): void {
    const view = this.currentViewService.view();
    if (view.readOnly) {
      return;
    }

    const data: SaveViewDialogData = {
      view,
      insightType: this.insightType(),
    };
    this.popupService.open<SaveViewDialogComponent, SaveViewDialogData, SaveViewDialogResult>(
      SaveViewDialogComponent,
      data,
      (result) => {
        if (!result) return;

        if (result.action === 'delete') {
          this.deleteView.emit(view.id);
        } else if (result.action === 'save' && result.name) {
          this.updateView.emit({
            id: view.id,
            name: result.name,
            description: result.description,
            shared: view.shared,
            columns: this.currentViewService.columns(),
            filters: this.currentViewService.filters(),
            sorts: this.currentViewService.sorts(),
            charts: this.currentViewService.charts(),
            callouts: this.currentViewService.callouts(),
          });
        }
      },
    );
  }
}
