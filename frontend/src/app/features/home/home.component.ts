import { Component, OnInit, OnDestroy, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { ChatService, Conversation } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreateGroupModal } from '../chat/create-group-modal/create-group-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatToolbarModule, MatIconModule, MatListModule, MatInputModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  conversations = signal<Conversation[]>([]);
  searchResults = signal<UserProfile[]>([]);
  isLoading = signal(true);
  isSearching = signal(false);

  currentUser: Signal<any>;
  searchQuery = '';
  searchTimeout: any;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    public socketService: SocketService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.socketService.connect();
    this.loadConversations();

    this.socketService.onGroupUpdatedCallback = (data) => {
      // Group changed, reload conversations
      this.loadConversations();
    };
  }

  ngOnDestroy() {
    clearTimeout(this.searchTimeout);
    this.socketService.onGroupUpdatedCallback = null;
  }

  loadConversations() {
    this.isLoading.set(true);
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations.set(data);
        this.isLoading.set(false);
        // Extract users from conversations to track their online status
        const usersInConvos = data.flatMap(c => c.participants);
        this.socketService.initializeOnlineUsersList(usersInConvos);
      },
      error: () => {
        this.isLoading.set(false);
      }
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
    }, 500); // 500ms debounce
  }

  clearSearch() {
    this.searchQuery = '';
    this.isSearching.set(false);
    this.searchResults.set([]);
  }

  startChat(targetUserId: string) {
    this.chatService.getOrCreateConversation(targetUserId).subscribe(convo => {
      this.router.navigate(['/chat', convo._id]);
    });
  }

  openConversation(conversationId: string) {
    this.router.navigate(['/chat', conversationId]);
  }

  openCreateGroup() {
    const dialogRef = this.dialog.open(CreateGroupModal, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Group created successfully, load latest
        this.loadConversations();
        // Navigate
        this.router.navigate(['/chat', result._id]);
      }
    });
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
  }
}
