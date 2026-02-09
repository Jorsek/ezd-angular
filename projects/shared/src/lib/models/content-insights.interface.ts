export interface ContentInsightsRequest {
  filter: {
    context: {
      type: 'FOLDER' | 'MAP';
      id: string;
    };
  };
  summaries: {
    content_type: SummaryConfig;
  };
  callouts: CalloutType[];
}

export type CalloutType = 'TOTAL_OBJECTS' | 'TOTAL_WORDS' | 'TOTAL_FOLDERS';

export interface SummaryConfig {
  type: 'OBJECTS' | 'WORDS';
  field: string;
}

export interface ContentInsightsResponse {
  callouts: {
    TOTAL_OBJECTS?: number;
    TOTAL_WORDS?: number;
    TOTAL_FOLDERS?: number;
  };
  summaries: {
    content_type: Array<{ name: string; value: number }>;
  };
}

export interface ContentInsightsSummary {
  totalFiles: number;
  totalWords: number;
  totalFolders: number;
  contentTypeBreakdown: ContentTypeBreakdownItem[];
}

export interface ContentTypeBreakdownItem {
  name: string;
  count: number;
}
