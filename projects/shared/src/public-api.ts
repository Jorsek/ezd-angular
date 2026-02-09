/*
 * Public API Surface of shared
 */

// Components
export * from './lib/components/button/button.component';
export * from './lib/components/find-replace/find-replace.component';
export * from './lib/components/find-replace-popup/find-replace-popup.component';
export { AlertBannerComponent } from './lib/components/alert-banner/alert-banner';
export type { AlertType } from './lib/components/alert-banner/alert-banner';
export { ResourceChipComponent } from './lib/components/resource-chip/resource-chip';
export { LocalizationInsightsComponent } from './lib/components/localization-insights/localization-insights';
export { FilterActionsComponent } from './lib/components/localization-insights/filter-actions/filter-actions';
export { AddFilterButtonComponent } from './lib/components/localization-insights/add-filter-button/add-filter-button';
export { FilterSectionComponent } from './lib/components/localization-insights/filter-section/filter-section';
export { FolderPickerComponent } from './lib/components/folder-picker/folder-picker';
export type { FolderSelectedEvent } from './lib/components/folder-picker/folder-picker';
export { StatCardComponent } from './lib/components/stat-card/stat-card';
export { WordCountPieChartComponent } from './lib/components/word-count-pie-chart/word-count-pie-chart';
export {
  PopupMenuComponent,
  PopupMenuTriggerDirective,
  PopupMenuItemComponent,
  PopupSubmenuComponent,
} from './lib/components/ccms-popup-menu';
export type { PopupMenuAlign, PopupMenuItemSelectedEvent } from './lib/components/ccms-popup-menu';
export {
  NotificationService,
  NotificationOutletComponent,
  NotificationRef,
  NOTIFICATION_REF,
} from './lib/components/ccms-notifications';
export type {
  NotificationType,
  NotificationConfig,
  NotificationState,
} from './lib/components/ccms-notifications';
export {
  FilterComponent,
  ListFilterComponent,
  TaxonomyFilterComponent,
  TextFilterComponent,
  SearchFilterComponent,
} from './lib/components/filters';
export { FolderInsightsDisplayComponent } from './lib/components/folder-drawer/folder-insights-display/folder-insights-display.component';
export { FolderInsightsComponent } from './lib/components/folder-drawer/folder-insights/folder-insights.component';
export { ContentReportComponent } from './lib/components/content-report/content-report';
export { CcmsReportComponent } from './lib/components/ccms-report';
export { PieChartComponent } from './lib/components/charts/pie-chart/pie-chart';
export { BarChartComponent } from './lib/components/charts/bar-chart/bar-chart';
export { DoughnutChartComponent } from './lib/components/charts/doughnut-chart/doughnut-chart';
export { LineChartComponent } from './lib/components/charts/line-chart/line-chart';
export { CardComponent } from './lib/components/card/card';
export { IconComponent } from './lib/components/icon/icon';
export type { IconName } from './lib/components/icon/icon';
export { CalloutSectionComponent } from './lib/components/reporting/callout-section/callout-section';
export type { CalloutConfig } from './lib/components/reporting/callout-section/callout-config.interface';

// Cell Renderer Components
export {
  DateCellComponent,
  HighlightCellComponent,
  JobsCellComponent,
  LinkCellComponent,
  NumberCellComponent,
  StatusCellComponent,
  TextCellComponent,
} from './lib/components/reporting/cell-renderers';
export type {
  DateFormat,
  JobInfo,
  JobClickCallback,
  LinkClickCallback,
  NumberFormat,
  StatusType,
} from './lib/components/reporting/cell-renderers';

// Services
export * from './lib/services/find-replace/find-replace.service';
export * from './lib/services/localization-insights/localization-insights.service';
export * from './lib/services/metadata/metadata-configuration.service';

// Models
export * from './lib/services/find-replace/models';
export * from './lib/models/resource-file.interface';
export * from './lib/models/filter.interface';
export * from './lib/models/localization-insights.interface';
export * from './lib/models/metadata-configuration.interface';
export * from './lib/models/filter-field.interface';
export * from './lib/models/content-insights.interface';
export * from './lib/models/gwt-presenter-bridge.interface';

// Utilities
export * from './lib/utils/file-download.util';
export * from './lib/utils/validators.util';
export * from './lib/utils/cms-path.util';
export {
  createInitialLoadTracker,
  type InitialLoadTracker,
} from './lib/utils/initial-load-tracker';
export {
  createPaginatedResource,
  type PageResponse,
  type PaginatedResource,
  type PaginatedResourceConfig,
} from './lib/utils/paginated-resource';
export {
  createPieChartOptions,
  type PieChartData,
  type PieChartConfig,
} from './lib/components/charts/pie-chart-options';
export {
  createBarChartOptions,
  createStackedBarChartOptions,
  type BarChartData,
  type StackedBarChartData,
  type BarChartConfig,
} from './lib/components/charts/bar-chart-options';
export {
  createDoughnutChartOptions,
  type DoughnutChartData,
  type DoughnutChartConfig,
} from './lib/components/charts/doughnut-chart-options';
export {
  createLineChartOptions,
  type LineChartData,
  type LineChartConfig,
} from './lib/components/charts/line-chart-options';

// Constants
export { CHART_COLOR_PALETTE } from './lib/constants/chart-colors';

// Extracted Metadata
export * from './lib/computed-metadata';

// Metadata Container (Angular wrapper for GWT integration)
export { MetadataContainerComponent } from './lib/components/metadata-container';

// Insights Container (tabbed Content Report + Localization Report)
export { InsightsContainerComponent } from './lib/components/insights-container/insights-container';

// API
export { provideApi } from './lib/api/provide-api';

// Version
export { VERSION } from './lib/version';
