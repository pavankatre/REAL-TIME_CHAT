import { Component, OnInit, OnDestroy, ViewChild, signal, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem,
  IonAvatar, IonButtons, IonBackButton, IonInput, IonButton, IonIcon,
  IonFooter, IonSpinner, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send, ellipsisVertical } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ChatService, Conversation, Message, PaginatedMessages } from '../../../core/services/chat.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chat-window',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/chat-list"></ion-back-button>
        </ion-buttons>
        <ion-avatar slot="start" class="header-avatar">
          <img [src]="otherUser()?.avatarUrl || 'assets/default-avatar.svg'" />
        </ion-avatar>
        <ion-title>
          <div class="header-title">
            <span class="name">{{ activeConversation()?.isGroup ? activeConversation()?.groupName : (otherUser()?.nickname || otherUser()?.email) }}</span>
            <span class="status" [class.online]="isUserOnline()">{{ isUserOnline() ? 'Online' : 'Offline' }}</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon name="ellipsis-vertical"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" #content class="ion-padding">
      <div class="messages-container">
        <div *ngFor="let msg of messages()" [class]="msg.sender._id === currentUserId ? 'msg-wrapper mine' : 'msg-wrapper theirs'">
           <div class="msg-bubble">
              <div class="msg-text">{{ msg.text }}</div>
              <div class="msg-footer">
                <span class="msg-time">{{ msg.createdAt | date:'shortTime' }}</span>
                <span class="msg-status" *ngIf="msg.sender._id === currentUserId">{{ msg.status }}</span>
              </div>
           </div>
        </div>

        <div *ngIf="isTyping()" class="typing-indicator theirs">
           <ion-text color="medium">{{ typingUser() || 'Someone' }} is typing...</ion-text>
        </div>
      </div>

      <div *ngIf="isLoading()" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <form (ngSubmit)="sendMessage()" class="input-form">
          <ion-item lines="none" class="input-item">
            <ion-input 
              [(ngModel)]="newMessage" 
              name="newMessage" 
              placeholder="Type a message..." 
              (ionInput)="onTyping()" 
              autocomplete="off">
            </ion-input>
          </ion-item>
          <ion-button slot="end" fill="clear" type="submit" [disabled]="!newMessage.trim()">
            <ion-icon name="send"></ion-icon>
          </ion-button>
        </form>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .header-avatar { width: 32px; height: 32px; margin-right: 10px; }
    .header-title { display: flex; flex-direction: column; }
    .header-title .name { font-size: 1rem; font-weight: bold; line-height: 1.2; }
    .header-title .status { font-size: 0.75rem; color: var(--ion-color-step-500); }
    .header-title .status.online { color: var(--ion-color-success); }
    
    .messages-container { display: flex; flex-direction: column; gap: 8px; padding-bottom: 20px; }
    .msg-wrapper { display: flex; width: 100%; margin-bottom: 4px; }
    .msg-wrapper.mine { justify-content: flex-end; }
    .msg-wrapper.theirs { justify-content: flex-start; }
    
    .msg-bubble { 
      max-width: 80%; 
      padding: 8px 12px; 
      border-radius: 16px; 
      position: relative;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .mine .msg-bubble { background: var(--ion-color-primary); color: white; border-bottom-right-radius: 4px; }
    .theirs .msg-bubble { background: var(--ion-color-step-100); color: black; border-bottom-left-radius: 4px; }
    
    .msg-footer { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 4px; font-size: 0.65rem; opacity: 0.7; }
    .typing-indicator { font-size: 0.8rem; margin-top: 5px; }
    
    .input-form { display: flex; align-items: center; width: 100%; padding: 0 8px; }
    .input-item { --background: transparent; flex: 1; }
  `],
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem,
    IonAvatar, IonButtons, IonBackButton, IonInput, IonButton, IonIcon,
    IonFooter, IonSpinner, IonText
  ]
})
export class ChatWindowPage implements OnInit, OnDestroy {
  @ViewChild('content') content!: IonContent;

  conversationId: string | null = null;
  messages = signal<Message[]>([]);
  activeConversation = signal<Conversation | null>(null);
  otherUser = signal<any>(null);

  newMessage = '';
  currentUserId = '';
  isLoading = signal(true);
  isTyping = signal(false);
  typingUser = signal('');
  typingTimeout: any;

  private messageSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService
  ) {
    addIcons({ send, ellipsisVertical });
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

    this.messageSubscription = this.socketService.newMessage$.subscribe((msg: Message) => {
      if (msg.conversationId === this.conversationId) {
        this.messages.update(prev => [...prev, msg]);
        this.scrollToBottom();
        if (msg.sender._id !== this.currentUserId) {
          this.socketService.markMessageSeen(msg._id, this.conversationId!);
        }
      }
    });

    this.socketService.onTypingStatusCallback = (data, typing) => {
      if (data.conversationId === this.conversationId && data.userId !== this.currentUserId) {
        this.isTyping.set(typing);
        this.typingUser.set(typing && data.user ? data.user.email.split('@')[0] : '');
      }
    };
  }

  ngOnDestroy() {
    this.messageSubscription?.unsubscribe();
    this.socketService.onTypingStatusCallback = null;
  }

  loadConversationDetails() {
    if (!this.conversationId) return;
    this.chatService.getConversations().subscribe(convos => {
      const convo = convos.find(c => c._id === this.conversationId);
      if (convo) {
        this.activeConversation.set(convo);
        this.otherUser.set(convo.participants.find((p: any) => p._id !== this.currentUserId));
      }
    });
  }

  loadMessages() {
    if (!this.conversationId) return;
    this.isLoading.set(true);
    this.chatService.getMessages(this.conversationId).subscribe({
      next: (res) => {
        this.messages.set(res.messages);
        this.isLoading.set(false);
        this.scrollToBottom();
        res.messages.forEach(m => {
          if (m.sender._id !== this.currentUserId && !m.seenBy.includes(this.currentUserId)) {
            this.socketService.markMessageSeen(m._id, this.conversationId!);
          }
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversationId) return;
    this.socketService.sendMessage(this.conversationId, this.newMessage);
    this.newMessage = '';
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
      if (this.content) this.content.scrollToBottom(300);
    }, 100);
  }

  isUserOnline(): boolean {
    const other = this.otherUser();
    return other ? this.socketService.onlineUsers().has(other._id) : false;
  }
}
