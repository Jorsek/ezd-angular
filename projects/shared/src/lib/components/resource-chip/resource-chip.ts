import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Resource } from '../../models/resource-file.interface';

type DitaType = 'NON_DITA' | 'MAP' | 'TOPIC';
type ChipMode = 'compact' | 'full';

/**
 * A resource chip component that displays a resource file's name with an icon indicator.
 *
 * Features:
 * - Shows filename with DITA type icon (topic or map)
 * - Supports two display modes:
 *   - 'compact' (default): icon + filename inline
 *   - 'full': icon aligned with title, filename below
 * - Supports two data modes:
 *   1. Full Resource object
 *   2. Lightweight inputs (filename, ditaType, etc.)
 * - Clickable when resource, shareUrl, or resourceUuid is provided
 * - Displays ezdPath or title on hover tooltip
 *
 * @example
 * ```html
 * <!-- Compact mode (default) -->
 * <ccms-resource-chip [resource]="myResource" />
 *
 * <!-- Full mode with title -->
 * <ccms-resource-chip
 *   mode="full"
 *   [title]="item.title"
 *   [filename]="item.filename"
 *   [shareUrl]="item.shareUrl"
 * />
 * ```
 */
@Component({
  selector: 'ccms-resource-chip',
  imports: [],
  templateUrl: './resource-chip.html',
  styleUrl: './resource-chip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'tooltipText()',
    '[class.resource-chip--topic]': 'isTopicType()',
    '[class.resource-chip--map]': 'isMapType()',
    '[class.resource-chip--non-dita]': 'isNonDita()',
    '[class.resource-chip--compact]': 'mode() === "compact"',
    '[class.resource-chip--full]': 'mode() === "full"',
    '[class.resource-chip--clickable]': 'isClickable()',
  },
})
export class ResourceChipComponent {
  /** The resource file data to display (full object mode). */
  resource = input<Resource>();

  /** Display title (shown in 'full' mode above filename). */
  title = input<string>();

  /** Filename for lightweight mode. */
  filename = input<string>();

  /** DITA type for lightweight mode. */
  ditaType = input<DitaType>();

  /** easyDITA path for tooltip display. */
  ezdPath = input<string>();

  /** Resource UUID for generating share link. */
  resourceUuid = input<string>();

  /** Direct share URL (takes precedence over generated URL from resourceUuid). */
  shareUrl = input<string>();

  /** Display mode: 'compact' (default) or 'full' (with title row). */
  mode = input<ChipMode>('compact');

  /** Computed display name from either Resource or individual input. */
  protected displayName = computed(() => this.resource()?.fileName ?? this.filename() ?? '');

  /** Computed display title from either title input or resource metadata. */
  protected displayTitle = computed(() => this.title() ?? this.resource()?.metadata?.title);

  /** Computed tooltip text - prefers ezdPath, falls back to metadata title, then filename. */
  protected tooltipText = computed(
    () => this.ezdPath() ?? this.resource()?.metadata?.title ?? this.displayName(),
  );

  /** Computed share URL - prefers direct shareUrl, falls back to generated from UUID. */
  protected computedShareUrl = computed(() => {
    const directUrl = this.shareUrl();
    if (directUrl) return directUrl;
    const uuid = this.resource()?.resourceUuid ?? this.resourceUuid();
    return uuid ? `/share/${uuid}` : null;
  });

  /** Whether the chip is clickable (has a link). */
  protected isClickable = computed(() => this.computedShareUrl() !== null);

  /** Resolved DITA type - uses explicit input or infers from filename extension. */
  protected resolvedDitaType = computed((): DitaType => {
    const explicit = this.ditaType();
    if (explicit) return explicit;

    const name = this.displayName();
    if (name.endsWith('.ditamap')) return 'MAP';
    if (name.endsWith('.dita')) return 'TOPIC';
    return 'NON_DITA';
  });

  /** Computed check if file is a topic type. */
  protected isTopicType = computed(() => this.resolvedDitaType() === 'TOPIC');

  /** Computed check if file is a map type. */
  protected isMapType = computed(() => this.resolvedDitaType() === 'MAP');

  /** Computed check if file is a non-DITA type. */
  protected isNonDita = computed(() => this.resolvedDitaType() === 'NON_DITA');

  /** Computed icon class based on DITA type. */
  protected iconClass = computed(() => {
    switch (this.resolvedDitaType()) {
      case 'MAP':
        return 'ji-Map';
      case 'TOPIC':
        return 'ji-Topic';
      default:
        return 'ji-File';
    }
  });
}
