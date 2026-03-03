import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ChatService } from '../../../core/services/chat.service';
import { UserProfile } from '../../../core/services/user.service';

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatIconModule, MatChipsModule],
  templateUrl: './create-group-modal.component.html',
  styleUrl: './create-group-modal.component.css'
})
export class CreateGroupModal {
  groupName = '';
  searchQuery = '';
  searchResults = signal<UserProfile[]>([]);
  selectedUsers = signal<UserProfile[]>([]);
  isLoading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<CreateGroupModal>,
    private chatService: ChatService
  ) { }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.chatService.searchUsers(this.searchQuery).subscribe({
      next: (users) => this.searchResults.set(users)
    });
  }

  toggleSelection(user: UserProfile) {
    const current = this.selectedUsers();
    if (current.find(u => u._id === user._id)) {
      this.selectedUsers.set(current.filter(u => u._id !== user._id));
    } else {
      this.selectedUsers.set([...current, user]);
    }
  }

  isSelected(user: UserProfile): boolean {
    return !!this.selectedUsers().find(u => u._id === user._id);
  }

  createGroup() {
    if (!this.groupName.trim() || this.selectedUsers().length === 0) return;

    this.isLoading.set(true);
    const participantIds = this.selectedUsers().map(u => u._id);

    this.chatService.createGroup(this.groupName, participantIds).subscribe({
      next: (convo) => {
        this.isLoading.set(false);
        this.dialogRef.close(convo); // Return the new conversation
      },
      error: () => this.isLoading.set(false)
    });
  }
}
