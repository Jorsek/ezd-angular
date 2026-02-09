import { forkJoin, Observable, of, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { DestroyRef, inject, Injectable, TemplateRef } from '@angular/core';
import { ColumnDef } from '../components/table/rich-table';
import { ComputedMetadataService } from '../computed-metadata/services/computed-metadata.service';
import { MetadataConfigurationService } from './metadata/metadata-configuration.service';

@Injectable({ providedIn: 'root' })
export class ColumnConfigFactoryService {
  private readonly EXCLUDED_METADATA_KEYS = new Set([
    'title',
    'status',
    'word-count',
    'char-count',
  ]);

  private metadataConfigService = inject(MetadataConfigurationService);
  private extractedMetadataService = inject(ComputedMetadataService);
  private destroyRef = inject(DestroyRef);

  /**
   * Constructs metadata ColumnDefs that can be used in a RichTableComponent
   * @param cellRenderer how to render the metadata column
   * @param options optional column config
   */
  public buildMetadataColumns<T>(
    cellRenderer: (metadataKey: string, row: T) => TemplateRef<unknown> | string,
    options?: {
      dropdownGroup?: string;
      showOnHover?: boolean;
      textSearchable?: boolean;
    },
  ): Observable<ColumnDef<T>[]> {
    const { dropdownGroup, showOnHover = false, textSearchable = false } = options ?? {};

    return forkJoin({
      metadataFields: this.metadataConfigService.getEnabledMetadataFields().pipe(
        take(1),
        catchError((err) => {
          console.warn('Failed to load metadata fields:', err);
          return of([]);
        }),
      ),

      extractedMetadata: this.extractedMetadataService.listDefinitions().pipe(
        take(1),
        catchError((err) => {
          console.warn('Failed to load extracted metadata definitions:', err);
          return of([]);
        }),
      ),
    }).pipe(
      map(({ metadataFields, extractedMetadata }) => {
        const metadataColumns: ColumnDef<T>[] = metadataFields
          .filter((field) => !this.EXCLUDED_METADATA_KEYS.has(field.name))
          .map((field) => {
            const metadataKey = field.name;

            return {
              id: `metadata:${metadataKey}`,
              label: field.displayName,
              dropdownGroup,
              visible: false,
              removable: true,
              sortable: true,
              showOnHover,
              textSearchable,
              cellTemplate: (row: T) => cellRenderer(metadataKey, row),
            };
          });

        const extractedColumns: ColumnDef<T>[] = extractedMetadata.map((def) => {
          const metadataKey = `computed:${def.key}`;

          return {
            id: `computed:${def.key}`,
            label: `Computed: ${def.name}`,
            dropdownGroup,
            visible: false,
            removable: true,
            sortable: true,
            showOnHover,
            textSearchable,
            cellTemplate: (row: T) => cellRenderer(metadataKey, row),
          };
        });

        return [...metadataColumns, ...extractedColumns];
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }
}
