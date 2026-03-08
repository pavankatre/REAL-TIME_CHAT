import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.page').then(m => m.RegisterPage)
      },
      {
        path: 'otp',
        loadComponent: () => import('./features/auth/otp/otp.page').then(m => m.OtpPage)
      }
    ]
  },
  {
    path: 'chat-window/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-window/chat-window.page').then(m => m.ChatWindowPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./features/tabs/tabs.routes').then(m => m.routes)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
