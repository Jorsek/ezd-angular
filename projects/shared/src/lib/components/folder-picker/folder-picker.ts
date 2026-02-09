import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  OnDestroy,
} from '@angular/core';

interface FolderPickerBridge {
  open: (callbackId: string) => void;
}

interface WindowWithBridge {
  ccmsFolderPicker?: FolderPickerBridge;
  [key: `__ccmsFolderCallback_${string}`]: ((uuid: string, name: string) => void) | undefined;
}

export interface FolderSelectedEvent {
  uuid: string;
  name: string;
}

@Component({
  selector: 'ccms-folder-picker',
  imports: [],
  templateUrl: './folder-picker.html',
  styleUrl: './folder-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderPickerComponent implements OnDestroy {
  folderUuid = input<string>('');
  folderName = input<string>('');
  folderPath = input<string>('');
  buttonText = input<string>('Browse');
  disabled = input<boolean>(false);
  placeholder = input<string>('No folder selected');

  folderChange = output<FolderSelectedEvent>();

  protected displayName = computed(() => this.folderName() || this.placeholder());
  protected tooltipText = computed(() => this.folderPath() || this.displayName());
  protected hasFolder = computed(() => this.folderUuid().length > 0);
  protected shareUrl = computed(() => {
    const uuid = this.folderUuid();
    return uuid ? `/share/${uuid}` : null;
  });

  private callbackId = `folder-picker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  private callbackKey: `__ccmsFolderCallback_${string}`;

  constructor() {
    this.callbackKey = `__ccmsFolderCallback_${this.callbackId}`;
    (window as unknown as WindowWithBridge)[this.callbackKey] = (uuid: string, name: string) =>
      this.onFolderSelected(uuid, name);
  }

  ngOnDestroy(): void {
    delete (window as unknown as WindowWithBridge)[this.callbackKey];
  }

  protected onBrowseClick(): void {
    const bridge = (window as unknown as WindowWithBridge).ccmsFolderPicker;
    if (bridge?.open) {
      bridge.open(this.callbackId);
    } else {
      console.warn('GWT folder picker bridge not available');
    }
  }

  private onFolderSelected(uuid: string, name: string): void {
    this.folderChange.emit({ uuid, name });
  }
}
