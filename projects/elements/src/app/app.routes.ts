import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/find-replace',
    pathMatch: 'full',
  },
  {
    path: 'find-replace',
    loadComponent: () => import('shared').then((m) => m.FindReplaceComponent),
  },
];
