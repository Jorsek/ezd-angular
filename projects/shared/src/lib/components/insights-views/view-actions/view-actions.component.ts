import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { InsightsView } from '../insights-views.models';

/**
 * View Actions Component
 *
 * Provides actions for managing views.
 */
@Component({
  selector: 'ccms-view-actions',
  templateUrl: './view-actions.component.html',
  styleUrl: './view-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ViewActionsComponent {
  view = input<InsightsView | null>(null);
  dirty = input<boolean>();
  editable = input<boolean>(true);
  showCreateButton = input<boolean>(true);
  loading = input<boolean>(false);
  hasView = computed(() => this.view() != null);
  updateView = output<InsightsView>();
  createView = output();
  copyView = output<InsightsView>();

  protected onUpdateView(): void {
    const currentView = this.view();
    if (currentView) {
      this.updateView.emit(currentView);
    }
  }

  protected onCreateView(): void {
    this.createView.emit();
  }
}
