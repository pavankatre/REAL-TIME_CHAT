import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket | null = null;
    public onlineUsers = signal<Map<string, string>>(new Map());

    // Use Subject for multiple listeners (Notifications + Active Chat)
    private newMessageSubject = new Subject<any>();
    public newMessage$ = this.newMessageSubject.asObservable();

    constructor(private authService: AuthService) { }

    connect() {
        if (this.socket?.connected) return;

        const token = this.authService.getToken();
        if (!token) return;

        this.socket = io(environment.apiUrl.replace('/api', ''), {
            auth: { token },
            withCredentials: true
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        this.socket.on('user_status_change', (data: { userId: string, status: string, lastSeen?: Date }) => {
            const currentMap = new Map(this.onlineUsers());

            if (data.status !== 'offline') {
                currentMap.set(data.userId, data.status);
            } else {
                currentMap.delete(data.userId);
            }

            this.onlineUsers.set(currentMap);
        });

        // Chat Event Listeners
        this.socket.on('new_message', (message: any) => {
            console.log('New message received:', message);
            this.newMessageSubject.next(message);
        });

        this.socket.on('user_typing', (data: { userId: string, user?: { email: string, avatarUrl: string }, conversationId: string }) => {
            this.emitTypingStatus(data, true);
        });

        this.socket.on('user_stop_typing', (data: { userId: string, conversationId: string }) => {
            this.emitTypingStatus(data, false);
        });

        this.socket.on('message_status_update', (data: { messageId: string, status: string, seenBy: string }) => {
            this.emitMessageStatusUpdate(data);
        });

        this.socket.on('group_updated', (data: { conversationId: string }) => {
            this.emitGroupUpdated(data);
        });
    }

    // --- Chat Emit Methods ---

    joinConversation(conversationId: string) {
        if (this.socket?.connected) {
            this.socket.emit('join_conversation', conversationId);
        }
    }

    sendMessage(conversationId: string, text: string) {
        if (this.socket?.connected) {
            this.socket.emit('send_message', { conversationId, text });
        }
    }

    sendTyping(conversationId: string, isTyping: boolean) {
        if (this.socket?.connected) {
            this.socket.emit(isTyping ? 'typing' : 'stop_typing', { conversationId });
        }
    }

    markMessageSeen(messageId: string, conversationId: string) {
        if (this.socket?.connected) {
            this.socket.emit('message_seen', { messageId, conversationId });
        }
    }

    markMessageDelivered(messageId: string, conversationId: string) {
        if (this.socket?.connected) {
            this.socket.emit('message_delivered', { messageId, conversationId });
        }
    }

    // --- Simple local Event Bus callbacks ---

    public onTypingStatusCallback: ((data: { userId: string, user?: { email: string, avatarUrl: string }, conversationId: string }, isTyping: boolean) => void) | null = null;
    private emitTypingStatus(data: { userId: string, user?: { email: string, avatarUrl: string }, conversationId: string }, isTyping: boolean) {
        if (this.onTypingStatusCallback) this.onTypingStatusCallback(data, isTyping);
    }

    public onMessageStatusUpdateCallback: ((data: { messageId: string, status: string, seenBy: string }) => void) | null = null;
    private emitMessageStatusUpdate(data: { messageId: string, status: string, seenBy: string }) {
        if (this.onMessageStatusUpdateCallback) this.onMessageStatusUpdateCallback(data);
    }

    public onGroupUpdatedCallback: ((data: { conversationId: string }) => void) | null = null;
    private emitGroupUpdated(data: { conversationId: string }) {
        if (this.onGroupUpdatedCallback) this.onGroupUpdatedCallback(data);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    initializeOnlineUsersList(users: any[]) {
        const currentMap = new Map(this.onlineUsers());
        users.forEach(user => {
            if (user.status !== 'offline') {
                currentMap.set(user._id, user.status);
            }
        });
        this.onlineUsers.set(currentMap);
    }
}
