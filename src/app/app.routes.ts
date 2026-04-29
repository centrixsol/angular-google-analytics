import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tracker/tracker').then((m) => m.TrackerComponent),
  },
];
