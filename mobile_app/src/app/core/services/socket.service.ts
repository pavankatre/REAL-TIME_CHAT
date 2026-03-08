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

    private newMessageSubject = new Subject<any>();
    public newMessage$ = this.newMessageSubject.asObservable();

    constructor(private authService: AuthService) { }

    connect() {
        if (this.socket?.connected) return;

        const token = this.authService.getToken();
        if (!token) {
            console.warn('[Mobile SocketService] No token found, cannot connect');
            return;
        }

        const socketUrl = environment.apiUrl.replace('/api', '');
        console.log('[Mobile SocketService] Connecting to:', socketUrl);

        this.socket = io(socketUrl, {
            auth: { token },
            withCredentials: true,
            transports: ['websocket'] // Often needed for mobile to avoid polling issues
        });

        this.socket.on('connect', () => {
            console.log('[Mobile SocketService] Connected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Mobile SocketService] Connection Error:', error);
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

        this.socket.on('new_message', (message: any) => {
            console.log('[Mobile SocketService] New message:', message);
            this.newMessageSubject.next(message);
        });

        this.socket.on('user_typing', (data: any) => {
            this.emitTypingStatus(data, true);
        });

        this.socket.on('user_stop_typing', (data: any) => {
            this.emitTypingStatus(data, false);
        });

        this.socket.on('message_status_update', (data: any) => {
            this.emitMessageStatusUpdate(data);
        });

        this.socket.on('group_updated', (data: any) => {
            this.emitGroupUpdated(data);
        });
    }

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

    public onTypingStatusCallback: ((data: any, isTyping: boolean) => void) | null = null;
    private emitTypingStatus(data: any, isTyping: boolean) {
        if (this.onTypingStatusCallback) this.onTypingStatusCallback(data, isTyping);
    }

    public onMessageStatusUpdateCallback: ((data: any) => void) | null = null;
    private emitMessageStatusUpdate(data: any) {
        if (this.onMessageStatusUpdateCallback) this.onMessageStatusUpdateCallback(data);
    }

    public onGroupUpdatedCallback: ((data: any) => void) | null = null;
    private emitGroupUpdated(data: any) {
        if (this.onGroupUpdatedCallback) this.onGroupUpdatedCallback(data);
    }

    disconnect() {
        if (this.socket) {
            console.log('[Mobile SocketService] Disconnecting');
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
