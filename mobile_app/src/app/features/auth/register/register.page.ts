import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
    IonInput, IonButton, IonText, IonLoading, IonIcon, IonButtons, IonBackButton, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Account</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="register-container">
        <div class="header-section ion-text-center ion-margin-bottom">
          <h1 class="ion-no-margin">Join Us</h1>
          <p class="ion-no-margin text-muted">Create an account to start chatting</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <ion-item lines="full" class="ion-margin-bottom">
            <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Email</ion-label>
            <ion-input formControlName="email" type="email" placeholder="Enter your email"></ion-input>
          </ion-item>

          <ion-item lines="full" class="ion-margin-bottom">
            <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Nickname</ion-label>
            <ion-input formControlName="nickname" type="text" placeholder="Your nickname"></ion-input>
          </ion-item>

          <ion-item lines="full" class="ion-margin-bottom">
            <ion-label position="stacked">Gender</ion-label>
            <ion-select formControlName="gender" placeholder="Select Gender">
              <ion-select-option value="male">Male</ion-select-option>
              <ion-select-option value="female">Female</ion-select-option>
              <ion-select-option value="other">Other</ion-select-option>
              <ion-select-option value="prefer-not-to-say">Prefer not to say</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item lines="full" class="ion-margin-bottom">
            <ion-icon name="lock-closed-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Password</ion-label>
            <ion-input formControlName="password" [type]="hidePassword() ? 'password' : 'text'" placeholder="Enter password"></ion-input>
            <ion-button fill="clear" slot="end" (click)="togglePasswordVisibility()">
              <ion-icon [name]="hidePassword() ? 'eye-outline' : 'eye-off-outline'"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-item lines="full" class="ion-margin-bottom">
            <ion-icon name="lock-closed-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Confirm Password</ion-label>
            <ion-input formControlName="confirmPassword" [type]="hidePassword() ? 'password' : 'text'" placeholder="Confirm password"></ion-input>
          </ion-item>

          <ion-button expand="block" type="submit" [disabled]="registerForm.invalid || isLoading()" class="ion-margin-top main-btn">
            <span *ngIf="!isLoading()">Register</span>
            <ion-loading [isOpen]="isLoading()" message="Creating account..."></ion-loading>
          </ion-button>

          <div *ngIf="errorMessage()" class="ion-padding ion-text-center">
            <ion-text color="danger">{{ errorMessage() }}</ion-text>
          </div>
        </form>

        <div class="footer-links ion-text-center ion-margin-top">
          <p>Already have an account? <ion-text color="primary" (click)="goToLogin()" class="link-btn">Sign In</ion-text></p>
        </div>
      </div>
    </ion-content>
  `,
    styles: [`
    .register-container { max-width: 500px; margin: 0 auto; padding-top: 20px; }
    .header-section h1 { font-size: 2rem; font-weight: 700; }
    .main-btn { --border-radius: 12px; height: 54px; font-weight: 600; }
    .link-btn { cursor: pointer; font-weight: 600; }
  `],
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, RouterModule,
        IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
        IonInput, IonButton, IonText, IonLoading, IonIcon, IonButtons, IonBackButton, IonSelect, IonSelectOption
    ]
})
export class RegisterPage {
    registerForm: FormGroup;
    hidePassword = signal(true);
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);

    constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
        addIcons({ eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, personOutline });
        this.registerForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            nickname: ['', [Validators.required]],
            gender: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
    }

    togglePasswordVisibility() { this.hidePassword.set(!this.hidePassword()); }

    onSubmit() {
        if (this.registerForm.valid) {
            this.isLoading.set(true);
            const { email, password, nickname, gender } = this.registerForm.value;
            this.authService.register({ email, password, nickname, gender }).subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.router.navigate(['/auth/otp'], { state: { email } });
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Registration failed.');
                }
            });
        }
    }

    goToLogin() { this.router.navigate(['/auth/login']); }
}
