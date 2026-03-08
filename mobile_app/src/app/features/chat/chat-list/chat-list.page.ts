import { Component, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
  IonList, IonAvatar, IonBadge, IonSearchbar, IonFab, IonFabButton, IonIcon,
  IonSpinner, IonText, IonButtons, IonButton, IonItemDivider
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, search, trash, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { ChatService, Conversation } from '../../../core/services/chat.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-chat-list',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Messages</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="loadConversations()" *ngIf="isLoading()">
            <ion-spinner name="crescent" size="small"></ion-spinner>
          </ion-button>
          <ion-button color="danger" (click)="logout()">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar 
          placeholder="Search people..." 
          [(ngModel)]="searchQuery" 
          (ionInput)="onSearch()"
          (ionClear)="clearSearch()">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <!-- Search Results -->
      <ion-list *ngIf="isSearching()">
        <ion-item-divider sticky>
          <ion-label>Search Results</ion-label>
        </ion-item-divider>
        <ion-item *ngFor="let user of searchResults()" (click)="startChat(user._id)" button>
          <ion-avatar slot="start">
            <img [src]="user.avatarUrl || 'assets/default-avatar.svg'" 
                 (error)="$event.target.src = 'https://ui-avatars.com/api/?name=' + (user.nickname || user.email)" />
          </ion-avatar>
          <ion-label>
            <h2>{{ user.nickname || user.email }}</h2>
            <p>{{ user.bio || 'Available' }}</p>
          </ion-label>
          <ion-badge color="success" slot="end" *ngIf="isUserOnline(user._id)">Online</ion-badge>
        </ion-item>
        <ion-item *ngIf="searchResults().length === 0 && !isLoading()">
          <ion-label class="ion-text-center">No users found</ion-label>
        </ion-item>
      </ion-list>

      <!-- Recent Conversations -->
      <ion-list *ngIf="!isSearching()">
        <ion-item *ngFor="let convo of conversations()" (click)="openConversation(convo._id)" button detail="false">
          <ion-avatar slot="start">
            <ng-container *ngIf="convo.isGroup; else privateAvatar">
                <div class="group-avatar">{{ convo.groupName?.charAt(0) }}</div>
            </ng-container>
            <ng-template #privateAvatar>
               <img [src]="getOtherParticipant(convo)?.avatarUrl || 'assets/default-avatar.svg'" 
                    (error)="$event.target.src = 'https://ui-avatars.com/api/?name=' + (getOtherParticipant(convo)?.nickname || getOtherParticipant(convo)?.email)" />
            </ng-template>
          </ion-avatar>
          <ion-label>
            <h2>{{ convo.isGroup ? convo.groupName : (getOtherParticipant(convo)?.nickname || getOtherParticipant(convo)?.email) }}</h2>
            <p class="last-msg">
                <span *ngIf="convo.lastMessage?.sender === currentUser()?.id" class="you-text">You: </span>
                {{ convo.lastMessage?.text || 'No messages yet' }}
            </p>
          </ion-label>
          <ion-text slot="end" color="medium" class="time-text">
            {{ convo.lastMessage?.createdAt | date:'shortTime' }}
          </ion-text>
        </ion-item>

        <!-- Empty State -->
        <div *ngIf="conversations().length === 0 && !isLoading()" class="empty-state ion-text-center ion-padding">
          <ion-icon name="chatbubbles-outline" size="large"></ion-icon>
          <h3>No chats yet</h3>
          <p>Search for friends to start chatting!</p>
        </div>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .group-avatar {
        width: 100%;
        height: 100%;
        background: var(--ion-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        border-radius: 50%;
    }
    .you-text { font-weight: bold; color: var(--ion-color-primary); }
    .last-msg { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .time-text { font-size: 0.75rem; }
    .empty-state { margin-top: 20%; color: var(--ion-color-step-400); }
  `],
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
    IonList, IonAvatar, IonBadge, IonSearchbar, IonFab, IonFabButton, IonIcon,
    IonSpinner, IonText, IonButtons, IonButton, IonItemDivider
  ]
})
export class ChatListPage implements OnInit {
  conversations = signal<Conversation[]>([]);
  searchResults = signal<UserProfile[]>([]);
  isLoading = signal(true);
  isSearching = signal(false);
  searchQuery = '';
  searchTimeout: any;

  currentUser: Signal<any>;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    public socketService: SocketService,
    private router: Router
  ) {
    addIcons({ add, search, trash, logOutOutline });
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.socketService.connect();
    this.loadConversations();
  }

  loadConversations() {
    this.isLoading.set(true);
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    if (!this.searchQuery.trim()) {
      this.isSearching.set(false);
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.searchTimeout = setTimeout(() => {
      this.chatService.searchUsers(this.searchQuery).subscribe(users => {
        this.searchResults.set(users);
      });
    }, 500);
  }

  clearSearch() {
    this.searchQuery = '';
    this.isSearching.set(false);
    this.searchResults.set([]);
  }

  startChat(targetUserId: string) {
    this.chatService.getOrCreateConversation(targetUserId).subscribe(convo => {
      this.clearSearch();
      this.openConversation(convo._id);
    });
  }

  openConversation(conversationId: string) {
    this.router.navigate(['/chat-window', conversationId]);
  }

  getOtherParticipant(convo: Conversation): UserProfile | undefined {
    const user = this.currentUser();
    const currentId = user ? (user as any).id : undefined;
    return convo.participants.find((p: UserProfile) => p._id !== currentId);
  }

  isUserOnline(userId: string): boolean {
    return this.socketService.onlineUsers().has(userId);
  }

  logout() {
    this.socketService.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
