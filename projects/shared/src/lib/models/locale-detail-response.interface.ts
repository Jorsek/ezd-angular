// src/app/models/locale-detail-response.interface.ts

/** Generic row type for localization details - server returns dynamic fields */
export type LocalizationDetailRow = Record<string, unknown>;

export interface LocaleDetailResponse {
  content: LocalizationDetailRow[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
