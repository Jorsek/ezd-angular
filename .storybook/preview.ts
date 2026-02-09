// Zone.js is required by Storybook's Angular integration
// Storybook uses zone-based change detection, while the production app uses zoneless
import 'zone.js';

import type { Preview } from '@storybook/angular';
import {Injectable} from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  provideHttpClient,
  withFetch, withInterceptorsFromDi
} from '@angular/common/http';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { Observable } from 'rxjs';
import { provideApi } from '../projects/shared/src/lib/api/provide-api';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    // Apply serif font to all stories
    (story) => {
      const storyResult = story();
      return {
        ...storyResult,
        template: `<div style="font-family: Georgia, 'Times New Roman', serif;">${storyResult.template || ''}</div>`,
      };
    },
    (story) => ({
      ...story(),
      applicationConfig: {
        providers: [
          provideHttpClient(
            withInterceptorsFromDi() // important
          ),
          {
            provide: HTTP_INTERCEPTORS,
            useClass: BasicAuthInterceptor,
            multi: true,
          },
          provideApi('/ezdnxtgen/api/turbo/proxy'),
          provideEchartsCore({ echarts }),
        ],
      },
    }),
  ],
};

@Injectable()
export class BasicAuthInterceptor implements HttpInterceptor {
  private readonly username = 'admin';
  private readonly password = '123';

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const authHeader =
      'Basic ' + btoa(`${this.username}:${this.password}`);

    const authReq = req.clone({
      setHeaders: {
        Authorization: authHeader,
      },
    });

    return next.handle(authReq);
  }
}

export default preview;
