import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PushNotificationService {
    private readonly VAPID_PUBLIC_KEY_URL = `${environment.apiUrl}/push/public-key`;
    private readonly SUBSCRIBE_URL = `${environment.apiUrl}/push/subscribe`;

    isSubscribed = signal(false);
    permissionStatus = signal<NotificationPermission>('default');

    constructor(
        private http: HttpClient,
        private swPush: SwPush,
        private router: Router
    ) {
        this.permissionStatus.set(Notification.permission);

        // Handle clicks on push notifications
        this.swPush.notificationClicks.subscribe(({ action, notification }: { action: string; notification: any }) => {
            console.log('Notification clicked:', notification);
            const url = notification.data?.url;
            if (url) {
                this.router.navigateByUrl(url);
            }
        });
    }

    async initAndSubscribe() {
        if (!this.swPush.isEnabled) {
            console.warn('Service Worker is not enabled or supported');
            return;
        }

        try {
            // 1. Get Public Key from Backend
            const response = await firstValueFrom(this.http.get<{ publicKey: string }>(this.VAPID_PUBLIC_KEY_URL));
            const publicKey = response.publicKey;

            // 2. Request Subscription
            const subscription = await this.swPush.requestSubscription({
                serverPublicKey: publicKey
            });

            // 3. Send Subscription to Backend
            await firstValueFrom(this.http.post(this.SUBSCRIBE_URL, { subscription }));

            this.isSubscribed.set(true);
            console.log('Successfully subscribed to push notifications');
        } catch (err) {
            console.error('Could not subscribe to push notifications', err);
        }
    }

    async unsubscribe() {
        try {
            await this.swPush.unsubscribe();
            this.isSubscribed.set(false);
        } catch (err) {
            console.error('Could not unsubscribe from push notifications', err);
        }
    }
}
