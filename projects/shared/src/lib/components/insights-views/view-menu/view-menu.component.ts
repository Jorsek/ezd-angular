import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  ViewEncapsulation,
} from '@angular/core';
import {
  PopupMenuComponent,
  PopupMenuItemComponent,
  PopupMenuTriggerDirective,
} from '../../ccms-popup-menu';

export interface ViewDescription {
  id: string;
  name: string;
  description: string;
}

/**
 * View Menu Component
 *
 * Displays a menu for selecting and managing saved views.
 */
@Component({
  selector: 'ccms-view-menu',
  templateUrl: './view-menu.component.html',
  styleUrl: './view-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [PopupMenuComponent, PopupMenuItemComponent, PopupMenuTriggerDirective],
})
export class ViewMenuComponent {
  items = input<ViewDescription[]>([]);
  loading = input<boolean>(false);
  selected = input<ViewDescription | null>(null);
  viewChanged = output<ViewDescription>();
  deleteView = output<ViewDescription>();
  editView = output<ViewDescription>();

  protected selectedView = linkedSignal(() => this.selected());

  protected onViewSelected(view: ViewDescription): void {
    this.selectedView.set(view);
    this.viewChanged.emit(view);
  }

  protected onEditView(event: MouseEvent, view: ViewDescription): void {
    event.stopPropagation();
    this.editView.emit(view);
  }
}
