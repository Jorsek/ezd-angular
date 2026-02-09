import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { provideApi } from 'shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideEchartsCore({ echarts }),
    provideApi('/ezdnxtgen/api/turbo/proxy'),
  ],
};
