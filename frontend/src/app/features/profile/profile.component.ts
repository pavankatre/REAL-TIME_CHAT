import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, UserProfile } from '../../core/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  profile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  message = signal<string | null>(null);
  isSuccess = signal(false);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private location: Location
  ) {
    this.profileForm = this.fb.group({
      avatarUrl: ['', [Validators.pattern('https?://.+')]],
      bio: ['', [Validators.maxLength(500)]],
      nickname: ['', [Validators.maxLength(50)]],
      gender: [''],
      status: ['online']
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getProfile().subscribe({
      next: (data: UserProfile) => {
        this.profile.set(data);
        this.profileForm.patchValue({
          avatarUrl: data.avatarUrl || '',
          bio: data.bio || '',
          nickname: data.nickname || '',
          gender: data.gender || '',
          status: data.status || 'online'
        });
      },
      error: (err: any) => {
        this.message.set('Failed to load profile.');
        this.isSuccess.set(false);
      }
    });
  }

  onSubmit() {
    if (this.profileForm.valid && this.profileForm.dirty) {
      this.isLoading.set(true);
      this.message.set(null);

      // We only send values that are set, properly converting empty strings to backend acceptance if needed
      const formValue = this.profileForm.value;

      this.userService.updateProfile(formValue).subscribe({
        next: (updatedProfile: UserProfile) => {
          this.profile.set(updatedProfile);
          // Update form to match new data and reset dirty state
          this.profileForm.reset({
            avatarUrl: updatedProfile.avatarUrl || '',
            bio: updatedProfile.bio || '',
            nickname: updatedProfile.nickname || '',
            gender: updatedProfile.gender || '',
            status: updatedProfile.status || 'online'
          });

          this.isLoading.set(false);
          this.isSuccess.set(true);
          this.message.set('Profile updated successfully!');
          setTimeout(() => this.message.set(null), 3000);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.isSuccess.set(false);
          this.message.set(err.error?.message || 'Failed to update profile.');
        }
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
