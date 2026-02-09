import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { inject } from '@angular/core';
import {
  MetadataConfigurationService,
  TaxonomyOption,
} from '../services/metadata/metadata-configuration.service';
import { FilterCategory, FilterOption, FilterType } from '../models/filter.interface';
import { Field } from '../models/filter-field.interface';

/** Configuration options for addField */
export interface AddFieldConfig {
  /** Override the filter type (e.g., use 'list' instead of default 'text') */
  type?: FilterType;
  /** Custom options provider function */
  options?: () => Observable<FilterOption[]>;
  /** Selection mode for list/taxonomy filters */
  selectionMode?: 'single' | 'multi';
  /** Whether the filter is searchable */
  searchable?: boolean;
}

/**
 * Creates a FilterBuilder factory function with services auto-wired via DI.
 * Must be called in an injection context (field initializer or constructor).
 *
 * @example
 * ```typescript
 * // In component class
 * private createFilterBuilder = injectFilterBuilder();
 *
 * // Later, in a computed or method
 * const builder = this.createFilterBuilder();
 * builder.addFields(fields);
 * const filters = builder.build();
 * ```
 */
export function injectFilterBuilder(): () => FilterBuilder {
  const metadataConfigService = inject(MetadataConfigurationService);
  return () => new FilterBuilder(metadataConfigService);
}

export class FilterBuilder {
  private metadataConfigService: MetadataConfigurationService;

  /** Internal array for building filters - safe to use in computed() */
  private _filters: FilterCategory[] = [];

  constructor(metadataConfigService: MetadataConfigurationService) {
    this.metadataConfigService = metadataConfigService;
  }

  /** Returns the built filters array */
  build(): FilterCategory[] {
    return this._filters;
  }

  add(filter: FilterCategory): FilterBuilder {
    this._filters = [...this._filters, filter];
    return this;
  }

  /**
   * Add a filter from a Field definition.
   * Converts the Field to a FilterCategory based on its type.
   *
   * @param field The field definition to convert
   * @param config Optional configuration to override default behavior
   */
  addField(field: Field, config?: AddFieldConfig): FilterBuilder {
    // Skip boolean fields - they don't make sense as filters
    if (field.type === 'boolean') {
      return this;
    }

    const base = {
      id: field.name,
      label: field.displayName,
      default: !!field.default,
      removable: !field.default,
      metadata: field.metadata,
    };

    let filter: FilterCategory;

    // If config provides type override, use that
    if (config?.type) {
      filter = {
        ...base,
        type: config.type,
        ...(config.selectionMode && { selectionMode: config.selectionMode }),
        ...(config.searchable !== undefined && { searchable: config.searchable }),
        ...(config.options && { options: config.options }),
      };
    } else {
      // Default behavior based on field type
      switch (field.type) {
        case 'number':
          filter = { ...base, type: 'number' as FilterType };
          break;

        case 'datetime':
          filter = { ...base, type: 'date' as FilterType };
          break;

        case 'taxonomy':
          filter = {
            ...base,
            type: 'taxonomy' as FilterType,
            selectionMode: config?.selectionMode ?? (field.multiSelect ? 'multi' : 'single'),
            searchable: config?.searchable ?? true,
            options:
              config?.options ??
              (() => this.getMetadataFieldOptions(field.name.replace(/^metadata:/, ''))),
          };
          break;

        default:
          // text, label -> text filter (or list if options provided)
          if (config?.options) {
            filter = {
              ...base,
              type: 'list' as FilterType,
              selectionMode: config.selectionMode ?? (field.multiSelect ? 'multi' : 'single'),
              searchable: config.searchable ?? true,
              options: config.options,
            };
          } else {
            filter = { ...base, type: 'text' as FilterType };
          }
          break;
      }
    }

    this._filters = [...this._filters, filter];
    return this;
  }

  /**
   * Add multiple filters from Field definitions.
   */
  addFields(fields: Field[]): FilterBuilder {
    for (const field of fields) {
      this.addField(field);
    }
    return this;
  }

  addFileStatusFilter(isDefault: boolean = true, removable: boolean = false): FilterBuilder {
    this._filters = [
      ...this._filters,
      {
        id: 'fileStatus',
        label: 'File Status',
        type: 'list',
        default: isDefault,
        removable: removable,
        selectionMode: 'multi',
        searchable: false,
        options: this.getFileStatusOptions.bind(this),
      },
    ];
    return this;
  }

  private getFileStatusOptions(): Observable<FilterOption[]> {
    return this.metadataConfigService.getFileStatuses().pipe(
      map((statuses) =>
        statuses.map((status) => ({
          value: status.name,
          label: status.displayName,
        })),
      ),
    );
  }

  public loadDynamicFilters(): FilterBuilder {
    // Use getFields() which already combines metadata and computed fields
    this.metadataConfigService
      .getFields()
      .pipe(take(1))
      .subscribe((fields) => {
        const dynamicFilters: FilterCategory[] = fields.map((field) => {
          if (field.type === 'taxonomy') {
            return {
              id: field.name,
              label: field.displayName,
              type: 'taxonomy' as const,
              default: false,
              removable: true,
              selectionMode: field.multiSelect ? 'multi' : 'single',
              searchable: true,
              metadata: true,
              options: () => this.getMetadataFieldOptions(field.name.replace(/^metadata:/, '')),
            };
          }
          // text, label, number, etc.
          return {
            id: field.name,
            label: field.displayName,
            type: 'text' as const,
            default: false,
            removable: true,
            metadata: true,
          };
        });

        this._filters = [...this._filters, ...dynamicFilters];
      });
    return this;
  }

  /** Get options for a specific metadata field */
  private getMetadataFieldOptions(fieldName: string): Observable<FilterOption[]> {
    return this.metadataConfigService.getTaxonomyFields().pipe(
      map((response) => {
        const options = response[fieldName];
        return options ? this.mapTaxonomyOptionsToFilterOptions(options) : [];
      }),
    );
  }

  /**
   * Recursively map taxonomy options (id/label) to FilterOptions (value/label).
   */
  private mapTaxonomyOptionsToFilterOptions(options: TaxonomyOption[]): FilterOption[] {
    return options.map((opt) => ({
      value: opt.id,
      label: opt.label,
      ...(opt.children && { children: this.mapTaxonomyOptionsToFilterOptions(opt.children) }),
    }));
  }
}
