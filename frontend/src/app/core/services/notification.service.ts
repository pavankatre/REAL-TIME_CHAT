import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface Notification {
    id: string;
    senderName: string;
    senderEmail: string;
    message: string;
    conversationId: string;
    timestamp: Date;
    isRead: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSignal = signal<Notification[]>([]);
    public notifications = this.notificationsSignal.asReadonly();

    public unreadCount = computed(() =>
        this.notificationsSignal().filter(n => !n.isRead).length
    );

    private audio = new Audio();
    private isAudioUnlocked = false;

    constructor(private router: Router) {
        // High-quality notification sound from a reliable source
        this.audio.src = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
        this.audio.load();
    }

    /**
     * Browsers block auto-playing audio until the user interacts with the page.
     * This method "unlocks" the audio context by playing a short silence/sound on first interaction.
     */
    unlockAudio() {
        if (this.isAudioUnlocked) return;

        this.audio.play().then(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isAudioUnlocked = true;
            console.log('Notification audio unlocked successfully');
        }).catch(err => {
            // This is expected if they haven't clicked yet
            console.log('Audio unlock deferred until user interaction');
        });
    }

    addNotification(message: any) {
        const newNotification: Notification = {
            id: message._id || Date.now().toString(),
            senderName: message.sender?.nickname || message.sender?.email?.split('@')[0] || 'Unknown',
            senderEmail: message.sender?.email || '',
            message: message.text,
            conversationId: message.conversationId,
            timestamp: new Date(message.createdAt),
            isRead: false
        };

        this.notificationsSignal.update(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
        this.playNotificationSound();
    }

    playNotificationSound() {
        // If not unlocked, we try anyway (it might work if they just clicked)
        this.audio.currentTime = 0;
        const playPromise = this.audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isAudioUnlocked = true;
            }).catch(error => {
                console.error('Audio playback failed (usually auto-play policy):', error);
            });
        }
    }

    markAsRead(notificationId: string) {
        this.notificationsSignal.update(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
    }

    markAllAsRead() {
        this.notificationsSignal.update(prev =>
            prev.map(n => ({ ...n, isRead: true }))
        );
    }

    clearAll() {
        this.notificationsSignal.set([]);
    }

    navigateToChat(notification: Notification) {
        this.markAsRead(notification.id);
        this.router.navigate(['/chat', notification.conversationId]);
    }
}
