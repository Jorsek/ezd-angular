import { InjectionToken } from '@angular/core';
import type { PopupRef } from './popup-ref';

export const POPUP_REF = new InjectionToken<PopupRef>('POPUP_REF');
export const POPUP_DATA = new InjectionToken<unknown>('POPUP_DATA');
