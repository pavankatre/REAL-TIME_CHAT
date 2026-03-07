import { Component, OnInit, OnDestroy, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { ChatService, Conversation } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { CreateGroupModal } from '../chat/create-group-modal/create-group-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CreateGroupModal],
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

  isCreateGroupModalOpen = signal(false);

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    public socketService: SocketService,
    private router: Router
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

  deleteConversation(event: MouseEvent, conversationId: string) {
    event.stopPropagation(); // Prevent opening the chat

    if (confirm('Are you sure you want to delete this chat? This will clear the history for you.')) {
      this.chatService.deleteConversation(conversationId).subscribe({
        next: () => {
          // Update local state
          this.conversations.update(convos => convos.filter(c => c._id !== conversationId));
        },
        error: (err) => {
          console.error('Error deleting conversation:', err);
          alert('Failed to delete conversation');
        }
      });
    }
  }

  openCreateGroup() {
    this.isCreateGroupModalOpen.set(true);
  }

  onGroupCreated(result: any) {
    this.isCreateGroupModalOpen.set(false);
    if (result) {
      this.loadConversations();
      this.router.navigate(['/chat', result._id]);
    }
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
