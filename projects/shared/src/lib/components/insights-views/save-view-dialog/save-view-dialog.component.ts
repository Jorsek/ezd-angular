import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PopupRef, POPUP_DATA, POPUP_REF } from '../../ccms-popup';
import { DialogButton, DialogComponent } from '../../ccms-dialog';
import { InsightsType, InsightsView } from '../insights-views.models';
import { ViewsService } from '../views.service';

export interface SaveViewDialogData {
  view?: InsightsView;
  insightType: InsightsType;
}

export interface SaveViewDialogResult {
  action: 'save' | 'delete';
  name?: string;
  description?: string;
}

type DialogMode = 'create' | 'edit' | 'confirm-delete';

@Component({
  selector: 'ccms-save-view-dialog',
  templateUrl: './save-view-dialog.component.html',
  styleUrl: './save-view-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [DialogComponent],
})
export class SaveViewDialogComponent {
  private popupRef = inject<PopupRef<SaveViewDialogResult>>(POPUP_REF);
  private data = inject<SaveViewDialogData>(POPUP_DATA);
  private viewsService = inject(ViewsService);

  private view = this.data.view ?? null;
  private views = toSignal(this.viewsService.get(this.data.insightType), {
    initialValue: [],
  });

  protected mode = signal<DialogMode>(this.view?.id ? 'edit' : 'create');

  protected title = computed(() => {
    const m = this.mode();
    if (m === 'create') return 'Save View';
    return 'Edit View';
  });

  protected showCloseButton = computed(() => this.mode() === 'edit');

  protected viewName = signal(this.view?.name ?? '');
  protected viewDescription = signal(this.view?.description ?? '');

  protected isDuplicateName = computed(() => {
    const name = this.viewName().trim().toLowerCase();
    if (!name) return false;

    const currentId = this.view?.id;
    return this.views().some((v) => v.name.toLowerCase() === name && v.id !== currentId);
  });

  protected buttons = computed<DialogButton[]>(() => {
    const m = this.mode();

    if (m === 'confirm-delete') {
      return [
        { label: 'Cancel', type: 'default', onClick: () => this.cancelDelete() },
        { label: 'Delete View', type: 'danger-action', onClick: () => this.confirmDelete() },
      ];
    }

    const buttons: DialogButton[] = [];

    if (m === 'edit' && !this.view?.readOnly) {
      buttons.push({
        label: 'Delete View',
        type: 'danger',
        onClick: () => this.startDelete(),
      });
    }

    buttons.push(
      { label: 'Cancel', type: 'default', onClick: () => this.cancel() },
      {
        label: m === 'create' ? 'Save View' : 'Save Changes',
        type: 'action',
        onClick: () => this.save(),
        disabled: !this.viewName().trim() || this.isDuplicateName(),
      },
    );

    return buttons;
  });

  protected onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.viewName.set(input.value);
  }

  protected onDescriptionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.viewDescription.set(textarea.value);
  }

  protected onEscapePressed(): void {
    if (this.mode() === 'confirm-delete') {
      this.cancelDelete();
    } else {
      this.cancel();
    }
  }

  private save(): void {
    const name = this.viewName().trim();
    if (!name) return;

    this.popupRef.close({
      action: 'save',
      name,
      description: this.viewDescription().trim(),
    });
  }

  private cancel(): void {
    this.popupRef.close();
  }

  private startDelete(): void {
    this.mode.set('confirm-delete');
  }

  private cancelDelete(): void {
    this.mode.set('edit');
  }

  private confirmDelete(): void {
    this.popupRef.close({ action: 'delete' });
  }
}
