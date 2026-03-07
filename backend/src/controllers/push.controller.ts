import { Request, Response } from 'express';
import { User } from '../models/user.model';

export class PushController {
    static getPublicKey(req: Request, res: Response) {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        if (!publicKey) {
            return res.status(500).json({ message: 'VAPID public key not found' });
        }
        res.status(200).json({ publicKey });
    }

    static async subscribe(req: Request, res: Response) {
        try {
            const { subscription } = req.body;
            const userId = (req as any).user.id;

            if (!subscription || !subscription.endpoint || !subscription.keys) {
                return res.status(400).json({ message: 'Invalid subscription object' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if subscription already exists
            const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);

            if (!exists) {
                user.pushSubscriptions.push(subscription);
                await user.save();
                console.log(`User ${userId} subscribed to push notifications`);
            }

            res.status(201).json({ message: 'Subscribed successfully' });
        } catch (error: any) {
            console.error(`Subscription error: ${error.message}`);
            res.status(500).json({ message: 'Failed to subscribe' });
        }
    }

    static async unsubscribe(req: Request, res: Response) {
        try {
            const { endpoint } = req.body;
            const userId = (req as any).user.id;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
            await user.save();

            res.status(200).json({ message: 'Unsubscribed successfully' });
        } catch (error: any) {
            console.error(`Unsubscription error: ${error.message}`);
            res.status(500).json({ message: 'Failed to unsubscribe' });
        }
    }
}
