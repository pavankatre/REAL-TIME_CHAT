import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
  IonButtons, IonInput, IonButton, IonIcon, IonList,
  IonSelect, IonSelectOption, IonTextarea, IonLoading, IonToast
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, cameraOutline, checkmarkCircleOutline, logOutOutline } from 'ionicons/icons';
import { UserService, UserProfile } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-profile',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button color="danger" (click)="logout()">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="profile-container">
        <div class="avatar-section ion-text-center ion-margin-bottom">
          <div class="avatar-wrapper">
            <img [src]="profileForm.get('avatarUrl')?.value || 'assets/default-avatar.svg'" class="profile-pic" />
            <div class="status-indicator" [class]="profileForm.get('status')?.value"></div>
          </div>
          <h2>{{ profile()?.nickname || 'Set Nickname' }}</h2>
          <p>{{ profile()?.email }}</p>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <ion-list lines="full">
            <ion-item>
              <ion-label position="stacked">Nickname</ion-label>
              <ion-input formControlName="nickname" placeholder="Your display name"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Status</ion-label>
              <ion-select formControlName="status">
                <ion-select-option value="online">Online</ion-select-option>
                <ion-select-option value="busy">Busy</ion-select-option>
                <ion-select-option value="offline">Appear Offline</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Gender</ion-label>
              <ion-select formControlName="gender">
                <ion-select-option value="male">Male</ion-select-option>
                <ion-select-option value="female">Female</ion-select-option>
                <ion-select-option value="other">Other</ion-select-option>
                <ion-select-option value="prefer-not-to-say">Prefer not to say</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Bio</ion-label>
              <ion-textarea formControlName="bio" placeholder="Tell us about yourself..." [autoGrow]="true"></ion-textarea>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Avatar URL</ion-label>
              <ion-input formControlName="avatarUrl" type="url" placeholder="https://example.com/image.jpg"></ion-input>
            </ion-item>
          </ion-list>

          <div class="avatar-presets ion-margin-top">
            <ion-label class="ion-padding-start">Quick Avatars</ion-label>
            <div class="presets-grid">
              <img *ngFor="let avatar of defaultAvatars" [src]="avatar" (click)="selectAvatar(avatar)" 
                   [class.selected]="profileForm.get('avatarUrl')?.value === avatar" />
            </div>
          </div>

          <ion-button expand="block" type="submit" [disabled]="profileForm.invalid || isLoading() || !profileForm.dirty" class="ion-margin-top main-btn">
            Update Profile
          </ion-button>
        </form>
      </div>

      <ion-loading [isOpen]="isLoading()" message="Updating..."></ion-loading>
      <ion-toast [isOpen]="showToast()" [message]="toastMsg()" duration="3000" (didDismiss)="showToast.set(false)"></ion-toast>
    </ion-content>
  `,
  styles: [`
    .profile-container { max-width: 600px; margin: 0 auto; }
    .avatar-wrapper { position: relative; width: 120px; height: 120px; margin: 0 auto 15px; }
    .profile-pic { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid var(--ion-color-primary-contrast); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .status-indicator { position: absolute; bottom: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; }
    .status-indicator.online { background: var(--ion-color-success); }
    .status-indicator.busy { background: var(--ion-color-danger); }
    .status-indicator.offline { background: var(--ion-color-step-400); }
    
    .presets-grid { display: flex; flex-wrap: wrap; gap: 10px; padding: 10px; justify-content: center; }
    .presets-grid img { width: 50px; height: 50px; border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
    .presets-grid img.selected { border-color: var(--ion-color-primary); transform: scale(1.1); }
    
    .main-btn { --border-radius: 12px; height: 54px; font-weight: 600; }
  `],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
    IonButtons, IonInput, IonButton, IonIcon, IonList,
    IonSelect, IonSelectOption, IonTextarea, IonLoading, IonToast
  ]
})
export class ProfilePage implements OnInit {
  profileForm: FormGroup;
  profile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  showToast = signal(false);
  toastMsg = signal('');

  defaultAvatars = [
    'https://api.dicebear.com/7.x/adventurer/png?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/png?seed=Jude',
    'https://api.dicebear.com/7.x/adventurer/png?seed=Liam',
    'https://api.dicebear.com/7.x/adventurer/png?seed=Finn',
    'https://api.dicebear.com/7.x/adventurer/png?seed=Mimi',
    'https://api.dicebear.com/7.x/adventurer/png?seed=Zoey'
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private socketService: SocketService
  ) {
    addIcons({ personOutline, cameraOutline, checkmarkCircleOutline, logOutOutline });
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
      }
    });
  }

  onSubmit() {
    if (this.profileForm.valid && this.profileForm.dirty) {
      this.isLoading.set(true);
      this.userService.updateProfile(this.profileForm.value).subscribe({
        next: (updated: UserProfile) => {
          this.profile.set(updated);
          this.profileForm.markAsPristine();
          this.isLoading.set(false);
          this.toastMsg.set('Profile updated!');
          this.showToast.set(true);
        },
        error: () => {
          this.isLoading.set(false);
          this.toastMsg.set('Update failed.');
          this.showToast.set(true);
        }
      });
    }
  }

  selectAvatar(url: string) {
    this.profileForm.patchValue({ avatarUrl: url });
    this.profileForm.get('avatarUrl')?.markAsDirty();
  }

  logout() {
    this.socketService.disconnect();
    this.authService.logout();
  }
}
