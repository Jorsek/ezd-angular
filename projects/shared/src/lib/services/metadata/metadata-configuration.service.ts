import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, take, shareReplay, Subject, switchMap, startWith } from 'rxjs';
import {
  MetadataConfiguration,
  MetadataField,
} from '../../models/metadata-configuration.interface';
import { Field, mapDataType, mapMetadataType } from '../../models/filter-field.interface';
import { ComputedMetadataService } from '../../computed-metadata/services/computed-metadata.service';
import { CachedHttpRequest } from '../../utils/cached-http-request';

/** File status from the editor config API */
export interface FileStatus {
  name: string;
  displayName: string;
}

/** Response from /api/config/editor-config endpoint */
interface EditorConfigResponse {
  statuses: FileStatus[];
}

/**
 * Taxonomy option from the taxonomy-fields API.
 * Uses 'id' instead of 'value' - consumers should map to their own types.
 */
export interface TaxonomyOption {
  id: string;
  label: string;
  children?: TaxonomyOption[];
}

/**
 * Response from /api/metadata/taxonomy-fields endpoint.
 * Maps field names to their hierarchical options.
 */
export type TaxonomyFieldsResponse = Record<string, TaxonomyOption[]>;

/**
 * Service for fetching metadata configuration from the server.
 * Provides cached access to metadata field definitions and file statuses.
 */
@Injectable({
  providedIn: 'root',
})
export class MetadataConfigurationService {
  private http = inject(HttpClient);
  private extractedMetadataService = inject(ComputedMetadataService);

  private configRequest = new CachedHttpRequest<MetadataConfiguration>(
    this.http,
    'GET',
    '/ezdnxtgen/api/metadata/configuration',
  );

  private editorConfigRequest = new CachedHttpRequest<EditorConfigResponse>(
    this.http,
    'GET',
    '/ezdnxtgen/api/config/editor-config',
  );

  private taxonomyFieldsRequest = new CachedHttpRequest<TaxonomyFieldsResponse>(
    this.http,
    'GET',
    '/ezdnxtgen/api/metadata/taxonomy-fields',
  );

  /** Subject to trigger fields refresh */
  private fieldsRefresh$ = new Subject<void>();

  /** Cached fields observable - combines metadata and computed fields */
  private fields$ = this.fieldsRefresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      forkJoin([
        this.getEnabledMetadataFields().pipe(take(1)),
        this.extractedMetadataService.listDefinitions().pipe(take(1)),
      ]).pipe(
        map(([metadataFields, extractedDefs]) => [
          ...metadataFields.map((f) => ({
            name: `metadata:${f.name}`,
            displayName: f.displayName,
            type: mapMetadataType(f.type),
            multiSelect: f.allowMultipleSelection ?? false,
            metadata: true as const,
          })),
          ...extractedDefs.map((d) => ({
            name: `computed:${d.key}`,
            displayName: d.name,
            type: mapDataType(d.dataType),
            multiSelect: d.multiValue,
            metadata: true as const,
            computed: true as const,
          })),
        ]),
      ),
    ),
    shareReplay(1),
  );

  /**
   * Fetches metadata configuration from the server.
   * Result is cached with shareReplay - only makes one API call per app session.
   *
   * @returns Observable of MetadataConfiguration
   */
  getMetadataConfiguration(): Observable<MetadataConfiguration> {
    return this.configRequest.get();
  }

  /**
   * Gets only the enabled metadata fields suitable for display in data tables.
   *
   * @returns Observable of MetadataField array
   */
  getEnabledMetadataFields(): Observable<MetadataField[]> {
    return this.configRequest.get().pipe(
      map((config) => {
        // Collect all enabled field names from categories
        const enabledFieldNames = new Set<string>();
        for (const category of config.allCategories) {
          for (const fieldRef of category.fieldRefs) {
            if (fieldRef.enabled) {
              enabledFieldNames.add(fieldRef.fieldName);
            }
          }
        }

        // Return the full field objects for enabled fields
        return config.allFields.filter((field) => enabledFieldNames.has(field.name));
      }),
    );
  }

  /**
   * Fetches file statuses from the editor config endpoint.
   * Result is cached - only makes one API call per app session.
   *
   * @returns Observable of FileStatus array
   */
  getFileStatuses(): Observable<FileStatus[]> {
    return this.editorConfigRequest.get().pipe(map((response) => response.statuses));
  }

  /**
   * Fetches taxonomy fields with their options from the server.
   * Result is cached - only makes one API call per app session.
   *
   * @returns Observable of TaxonomyFieldsResponse (field name -> options mapping)
   */
  getTaxonomyFields(): Observable<TaxonomyFieldsResponse> {
    return this.taxonomyFieldsRequest.get();
  }

  /**
   * Gets a unified list of filter fields combining enabled metadata fields
   * and extracted metadata definitions.
   * Each field is prefixed with 'metadata:' or 'computed:' to distinguish its source.
   * Result is cached - call refreshMetadataConfiguration() to refresh.
   */
  getFields(): Observable<Field[]> {
    return this.fields$;
  }

  /**
   * Refreshes all metadata configuration by re-fetching from the server.
   */
  refreshMetadataConfiguration(): void {
    this.configRequest.refresh();
    this.editorConfigRequest.refresh();
    this.taxonomyFieldsRequest.refresh();
    this.fieldsRefresh$.next();
  }
}
