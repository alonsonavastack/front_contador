import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { roleGuard } from './core/role-guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/login/login').then(m => m.LoginPage) 
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
    children: [
      { 
        path: '', 
        redirectTo: 'mis-documentos', 
        pathMatch: 'full' 
      },
      { 
        path: 'mis-documentos', 
        loadComponent: () => import('./features/mis-docs/mis-docs').then(m => m.MisDocsPage) 
      },
      { 
        path: 'usuarios', 
        loadComponent: () => import('./features/usuarios/usuarios').then(m => m.UsuariosPage), 
        canActivate: [roleGuard(['ADMIN_ROLE'])] 
      },
      { 
        path: 'docs-admin', 
        loadComponent: () => import('./features/docs-admin/docs-admin').then(m => m.DocsAdminPage), 
        canActivate: [roleGuard(['ADMIN_ROLE'])] 
      },
    ]
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];
