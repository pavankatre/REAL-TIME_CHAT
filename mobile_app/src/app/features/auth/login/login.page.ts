import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
  IonInput, IonButton, IonText, IonLoading, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="login-container">
        <div class="header-section ion-text-center ion-margin-bottom">
          <h1 class="ion-no-margin">Welcome Back</h1>
          <p class="ion-no-margin text-muted">Sign in to continue chatting</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <ion-item lines="full" class="ion-margin-bottom">
            <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Email</ion-label>
            <ion-input 
              formControlName="email" 
              type="email" 
              placeholder="Enter your email">
            </ion-input>
          </ion-item>
          <div class="error-msg ion-padding-horizontal" *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid">
            <ion-text color="danger" *ngIf="loginForm.get('email')?.hasError('required')">Email is required</ion-text>
            <ion-text color="danger" *ngIf="loginForm.get('email')?.hasError('email')">Invalid email format</ion-text>
          </div>

          <ion-item lines="full" class="ion-margin-bottom">
            <ion-icon name="lock-closed-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Password</ion-label>
            <ion-input 
              formControlName="password" 
              [type]="hidePassword() ? 'password' : 'text'" 
              placeholder="Enter your password">
            </ion-input>
            <ion-button fill="clear" slot="end" (click)="togglePasswordVisibility()" class="ion-no-margin">
              <ion-icon [name]="hidePassword() ? 'eye-outline' : 'eye-off-outline'"></ion-icon>
            </ion-button>
          </ion-item>
          <div class="error-msg ion-padding-horizontal" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
            <ion-text color="danger" *ngIf="loginForm.get('password')?.hasError('required')">Password is required</ion-text>
            <ion-text color="danger" *ngIf="loginForm.get('password')?.hasError('minlength')">Minimum 6 characters</ion-text>
          </div>

          <div class="ion-text-right ion-margin-bottom">
            <ion-text color="primary" class="forgot-btn">Forgot Password?</ion-text>
          </div>

          <ion-button expand="block" type="submit" [disabled]="loginForm.invalid || isLoading()" class="ion-margin-top main-btn">
            Sign In
          </ion-button>

          <ion-loading [isOpen]="isLoading()" message="Authenticating..." [duration]="5000"></ion-loading>

          <div *ngIf="errorMessage()" class="ion-padding ion-text-center">
            <ion-text color="danger">{{ errorMessage() }}</ion-text>
            <div *ngIf="errorMessage() === 'Please verify your email first'" class="ion-margin-top">
              <ion-button fill="clear" (click)="onVerifyEmail()">Verify Email Now</ion-button>
            </div>
          </div>
        </form>

        <div class="footer-links ion-text-center ion-margin-top">
          <p>Don't have an account? <ion-text color="primary" (click)="goToRegister()" class="link-btn">Create one</ion-text></p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      max-width: 500px;
      margin: 0 auto;
      padding-top: 40px;
    }
    .header-section h1 {
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--ion-color-step-900);
    }
    .text-muted {
      color: var(--ion-color-step-600);
      font-size: 1rem;
    }
    .error-msg {
      font-size: 0.8rem;
      margin-top: -10px;
      margin-bottom: 10px;
    }
    .forgot-btn, .link-btn {
      cursor: pointer;
      font-weight: 600;
    }
    .main-btn {
      --border-radius: 12px;
      height: 54px;
      font-weight: 600;
      font-size: 1.1rem;
    }
  `],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
    IonInput, IonButton, IonText, IonLoading, IonIcon
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Login failed. Please check your credentials.');
        }
      });
    }
  }

  onVerifyEmail() {
    const email = this.loginForm.get('email')?.value;
    if (email) {
      this.router.navigate(['/auth/otp'], { state: { email } });
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
