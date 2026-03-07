import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (!publicKey || !privateKey) {
    console.error('VAPID keys are not defined in environmental variables');
}

webpush.setVapidDetails(
    'mailto:' + (process.env.EMAIL_USER || 'admin@example.com'),
    publicKey,
    privateKey
);

import { User } from '../models/user.model';

export class PushService {
    static async sendNotification(subscription: any, payload: any) {
        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            console.log('Push notification sent successfully');
        } catch (error: any) {
            console.error(`Error sending push notification: ${error.message}`);
            if (error.statusCode === 404 || error.statusCode === 410) {
                // Subscription has expired or is no longer valid
                return { isExpired: true };
            }
        }
        return { isExpired: false };
    }

    static async sendToUser(userId: string, payload: any) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
                return;
            }

            const results = await Promise.all(
                user.pushSubscriptions.map(sub => this.sendNotification(sub, payload))
            );

            // Clean up expired subscriptions
            const hasExpired = results.some(r => r.isExpired);
            if (hasExpired) {
                user.pushSubscriptions = user.pushSubscriptions.filter((_, index) => !results[index].isExpired);
                await user.save();
            }
        } catch (error: any) {
            console.error(`Error sending to user ${userId}: ${error.message}`);
        }
    }
}

export default PushService;
