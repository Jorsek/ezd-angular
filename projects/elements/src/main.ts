import { bootstrapApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import {
  ContentReportComponent,
  FindReplacePopupComponent,
  FolderInsightsComponent,
  InsightsContainerComponent,
  LocalizationInsightsComponent,
  MetadataContainerComponent,
} from 'shared';
import { QualityReportComponent } from '../../shared/src/lib/components/quality-report/quality-report';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    const injector = appRef.injector;

    // Register Angular components as custom elements for GWT integration
    const popupElement = createCustomElement(FindReplacePopupComponent, { injector });
    customElements.define('ccms-find-replace-popup', popupElement);

    const insightsElement = createCustomElement(LocalizationInsightsComponent, { injector });
    customElements.define('ccms-localization-insights', insightsElement);

    const qualityReportElement = createCustomElement(QualityReportComponent, { injector });
    customElements.define('ccms-quality-report', qualityReportElement);

    const metadataContainerElement = createCustomElement(MetadataContainerComponent, { injector });
    customElements.define('ccms-metadata-container', metadataContainerElement);

    const folderInsightsElement = createCustomElement(FolderInsightsComponent, { injector });
    customElements.define('ccms-folder-insights', folderInsightsElement);

    const contentReportElement = createCustomElement(ContentReportComponent, { injector });
    customElements.define('ccms-content-report', contentReportElement);

    const insightsContainerElement = createCustomElement(InsightsContainerComponent, { injector });
    customElements.define('ccms-insights-container', insightsContainerElement);

    console.log('[AngularCCMS] Custom elements registered:', [
      'ccms-find-replace-popup',
      'ccms-localization-insights',
      'ccms-quality-report',
      'ccms-metadata-container',
      'ccms-folder-insights',
      'ccms-content-report',
      'ccms-insights-container',
    ]);
  })
  .catch((err) => console.error(err));
