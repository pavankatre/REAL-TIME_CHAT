import { Component, Inject, signal, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Conversation } from '../../../core/services/chat.service';
import { UserProfile, UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-group-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-settings-modal.component.html',
  styleUrl: './group-settings-modal.component.css'
})
export class GroupSettingsModal implements OnInit {
  @Input({ required: true }) data!: Conversation;
  @Output() close = new EventEmitter<void>();

  groupName = '';
  participants = signal<UserProfile[]>([]);
  isAdmin = false;
  currentUserId = '';
  currentUserEmail = '';

  // Edit state
  isEditingName = false;
  editNameInput = '';

  // Search state
  searchQuery = '';
  searchResults = signal<UserProfile[]>([]);
  isLoading = signal(false);

  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.groupName = this.data.groupName || 'Group Chat';
    this.editNameInput = this.groupName;
    this.participants.set(this.data.participants);

    const currentProfile = this.userService.userProfile();
    this.currentUserId = currentProfile?._id || '';
    this.currentUserEmail = currentProfile?.email || '';

    this.isAdmin = this.data.admin === this.currentUserId;
  }

  saveName() {
    if (!this.editNameInput.trim() || this.editNameInput === this.groupName) {
      this.isEditingName = false;
      return;
    }

    this.isLoading.set(true);
    this.chatService.updateGroup(this.data._id, { groupName: this.editNameInput }).subscribe({
      next: (updatedConvo) => {
        this.groupName = updatedConvo.groupName || this.editNameInput;
        this.isEditingName = false;
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.chatService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        // Filter out users already in the group
        const existingIds = this.participants().map(p => p._id);
        const filtered = users.filter((u: UserProfile) => !existingIds.includes(u._id));
        this.searchResults.set(filtered);
      }
    });
  }

  addParticipant(user: UserProfile) {
    this.isLoading.set(true);
    this.chatService.updateGroup(this.data._id, { addParticipants: [user._id] }).subscribe({
      next: (updatedConvo) => {
        this.participants.set(updatedConvo.participants);
        this.searchQuery = '';
        this.searchResults.set([]);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  removeParticipant(userId: string) {
    if (confirm('Are you sure you want to remove this member?')) {
      this.isLoading.set(true);
      this.chatService.updateGroup(this.data._id, { removeParticipants: [userId] }).subscribe({
        next: (updatedConvo) => {
          this.participants.set(updatedConvo.participants);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }
}
