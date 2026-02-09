export type LocalizationStatus = 'Current' | 'Missing' | 'Out-of-date';
export type FileStatus =
  | 'On Hold'
  | 'In Progress'
  | 'In Review'
  | 'Approved'
  | 'Needs Reevaluation'
  | 'Obsoleted'
  | 'Authoring';

export interface LocalizationRow {
  id: string;
  sourceResourceUuid: string;
  filename: string;
  title?: string;
  localizationStatus: LocalizationStatus;
  jobs: number[];
  localeCode?: string;
  localeDisplay: string;
  status?: string;
  statusDisplay?: string;
  wordCount?: number;
  charCount?: number;
  mimeType?: string;
  dueDate?: string;
  metadata?: Record<string, string | string[]>;
}
