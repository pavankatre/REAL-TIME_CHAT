import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Conversation, Message, PaginatedMessages } from '../../../core/services/chat.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { GroupSettingsModal } from '../group-settings-modal/group-settings-modal.component';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-chat-window',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, MessageBubbleComponent, GroupSettingsModal],
    templateUrl: './chat-window.component.html',
    styleUrl: './chat-window.component.css'
})
export class ChatWindowComponent implements OnInit, OnDestroy {
    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    conversationId: string | null = null;
    messages = signal<Message[]>([]);
    activeConversation = signal<Conversation | null>(null);
    otherUser = signal<any>(null); // from participants array

    newMessage = '';
    currentUserId = '';

    // Pagination
    currentPage = 1;
    hasMore = true;
    isLoading = signal(true);
    isLoadingMore = signal(false);

    // Typing state
    isTyping = signal(false);
    typingUser = signal<string>(''); // specific user for groups
    typingTimeout: any;

    isSettingsOpen = signal(false);
    version = environment.version;
    private messageSubscription?: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private chatService: ChatService,
        public socketService: SocketService,
        private authService: AuthService
    ) {
        const user = this.authService.currentUser();
        this.currentUserId = user ? (user as any).id : '';
    }

    ngOnInit() {
        this.conversationId = this.route.snapshot.paramMap.get('id');
        if (!this.conversationId) return;

        this.socketService.connect();
        this.socketService.joinConversation(this.conversationId);

        this.loadConversationDetails();
        this.loadMessages();

        // Subscribe to New Messages
        this.messageSubscription = this.socketService.newMessage$.subscribe((msg: Message) => {
            if (msg.conversationId === this.conversationId) {
                // Optimistic UI, append at end
                this.messages.update(prev => [...prev, msg]);
                this.scrollToBottom();

                // If I am not the sender, mark it as delivered then seen
                if (msg.sender._id !== this.currentUserId) {
                    this.socketService.markMessageDelivered(msg._id, this.conversationId!);
                    this.socketService.markMessageSeen(msg._id, this.conversationId!);
                }
            }
        });

        this.socketService.onTypingStatusCallback = (data: { userId: string, user?: { email: string, avatarUrl: string }, conversationId: string }, typing: boolean) => {
            if (data.conversationId === this.conversationId && data.userId !== this.currentUserId) {
                this.isTyping.set(typing);
                if (typing && data.user) {
                    this.typingUser.set(data.user.email.split('@')[0]);
                } else if (!typing) {
                    this.typingUser.set('');
                }
            }
        };

        this.socketService.onMessageStatusUpdateCallback = (data: { messageId: string, status: string, seenBy: string }) => {
            // Update local signal array
            const updatedMessages = this.messages().map((m: Message) => {
                if (m._id === data.messageId) {
                    return { ...m, status: data.status as any, seenBy: [...m.seenBy, data.seenBy] };
                }
                return m;
            });
            this.messages.set(updatedMessages);
        };

        this.socketService.onGroupUpdatedCallback = (data: { conversationId: string }) => {
            if (data.conversationId === this.conversationId) {
                this.loadConversationDetails(); // refresh metadata
            }
        };
    }

    ngOnDestroy() {
        this.messageSubscription?.unsubscribe();
        this.socketService.onTypingStatusCallback = null;
        this.socketService.onMessageStatusUpdateCallback = null;
        this.socketService.onGroupUpdatedCallback = null;
    }

    loadConversationDetails() {
        if (!this.conversationId) return;
        this.chatService.getConversations().subscribe((convos: Conversation[]) => {
            const convo = convos.find((c: Conversation) => c._id === this.conversationId);
            if (convo) {
                this.activeConversation.set(convo);
                const other = convo.participants.find((p: any) => p._id !== this.currentUserId);
                this.otherUser.set(other);

                // If the user was removed from the group, activeConversation logic here handles but wouldn't prevent staying.
                // Ideally, robust apps boot users out, but for simplicity we rely on the list component refresh.
            }
        });
    }

    loadMessages(appendTop = false) {
        if (!this.conversationId) return;

        if (appendTop) {
            this.isLoadingMore.set(true);
        } else {
            this.isLoading.set(true);
        }

        this.chatService.getMessages(this.conversationId, this.currentPage).subscribe({
            next: (res: PaginatedMessages) => {
                if (appendTop) {
                    // Saving current scroll height to restore position after prepend
                    const container = this.messagesContainer.nativeElement;
                    const oldScrollHeight = container.scrollHeight;

                    this.messages.update(prev => [...res.messages, ...prev]);

                    setTimeout(() => {
                        container.scrollTop = container.scrollHeight - oldScrollHeight;
                    }, 0);
                } else {
                    this.messages.set(res.messages);
                    this.scrollToBottom();
                }

                this.hasMore = res.pagination.hasMore;
                this.isLoading.set(false);
                this.isLoadingMore.set(false);

                // Mark unread as seen
                res.messages.forEach((m: Message) => {
                    if (m.sender._id !== this.currentUserId && !m.seenBy.includes(this.currentUserId)) {
                        this.socketService.markMessageSeen(m._id, this.conversationId!);
                    }
                });
            },
            error: () => {
                this.isLoading.set(false);
                this.isLoadingMore.set(false);
            }
        });
    }

    openGroupSettings() {
        const convo = this.activeConversation();
        if (!convo || !convo.isGroup) return;
        this.isSettingsOpen.set(true);
    }

    groupParticipantsText(): string {
        const convo = this.activeConversation();
        if (!convo) return '';
        const names = convo.participants.map(p => p.email.split('@')[0]);
        if (names.length <= 3) return names.join(', ');
        return `${names.slice(0, 3).join(', ')} and ${names.length - 3} others`;
    }

    onScroll(event: any) {
        const element = event.target;
        // Load more when scrolled to the very top
        if (element.scrollTop === 0 && this.hasMore && !this.isLoadingMore()) {
            this.currentPage++;
            this.loadMessages(true);
        }
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.conversationId) return;

        this.socketService.sendMessage(this.conversationId, this.newMessage);
        this.newMessage = '';

        // Stop typing indicator immediately
        this.socketService.sendTyping(this.conversationId, false);
        clearTimeout(this.typingTimeout);
    }

    onTyping() {
        if (!this.conversationId) return;

        this.socketService.sendTyping(this.conversationId, true);

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.socketService.sendTyping(this.conversationId!, false);
        }, 2000);
    }

    scrollToBottom() {
        setTimeout(() => {
            if (this.messagesContainer) {
                const container = this.messagesContainer.nativeElement;
                container.scrollTop = container.scrollHeight;
            }
        }, 100);
    }

    getOtherUserStatus(): string {
        const other = this.otherUser();
        if (!other) return 'offline';
        return this.socketService.onlineUsers().get(other._id) || 'offline';
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    }
}
