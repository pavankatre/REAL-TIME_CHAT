import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
    {
        path: 'tabs',
        component: TabsPage,
        children: [
            {
                path: 'chat-list',
                loadComponent: () => import('../chat/chat-list/chat-list.page').then(m => m.ChatListPage)
            },
            {
                path: 'profile',
                loadComponent: () => import('../profile/profile.page').then(m => m.ProfilePage)
            },
            {
                path: '',
                redirectTo: '/tabs/chat-list',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/tabs/chat-list',
        pathMatch: 'full'
    }
];
