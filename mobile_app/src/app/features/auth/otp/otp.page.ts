import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
  IonInput, IonButton, IonLoading, IonButtons, IonBackButton, IonToast
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-otp',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Verify OTP</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="otp-container ion-text-center">
        <div class="header-section ion-margin-bottom">
          <h1 class="ion-no-margin">Check Your Email</h1>
          <p class="text-muted">We've sent a code to<br><strong>{{ email() }}</strong></p>
        </div>

        <form [formGroup]="otpForm" (ngSubmit)="onSubmit()">
          <ion-item lines="full" class="ion-margin-bottom">
            <ion-label position="stacked">OTP Code</ion-label>
            <ion-input formControlName="otp" type="text" placeholder="000000" class="otp-input"></ion-input>
          </ion-item>

          <ion-button expand="block" type="submit" [disabled]="otpForm.invalid || isLoading()" class="main-btn">
            Verify & Create Account
          </ion-button>

          <ion-loading [isOpen]="isLoading()" message="Verifying..."></ion-loading>

          <div class="resend-section ion-margin-top">
            <p>Didn't receive code?</p>
            <ion-button fill="clear" (click)="onResendOtp()" [disabled]="resendLoading()">
              {{ resendLoading() ? 'Resending...' : 'Resend Code' }}
            </ion-button>
          </div>
        </form>
      </div>
      <ion-toast [isOpen]="showToast()" [message]="toastMsg()" duration="3000" (didDismiss)="showToast.set(false)"></ion-toast>
    </ion-content>
  `,
  styles: [`
    .otp-container { max-width: 400px; margin: 0 auto; padding-top: 40px; }
    .otp-input { --padding-start: 0; font-size: 1.5rem; letter-spacing: 0.5rem; text-align: center; font-weight: 700; }
    .main-btn { --border-radius: 12px; height: 54px; font-weight: 600; margin-top: 20px; }
  `],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel,
    IonInput, IonButton, IonLoading, IonButtons, IonBackButton, IonToast
  ]
})
export class OtpPage implements OnInit {
  otpForm: FormGroup;
  email = signal('');
  isLoading = signal(false);
  resendLoading = signal(false);
  showToast = signal(false);
  toastMsg = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && state['email']) {
      this.email.set(state['email']);
    }
  }

  ngOnInit() {
    if (!this.email()) {
      this.router.navigate(['/auth/login']);
    }
  }

  onSubmit() {
    if (this.otpForm.valid) {
      this.isLoading.set(true);
      this.authService.verifyOtp({ email: this.email(), otp: this.otpForm.value.otp }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.toastMsg.set('Email verified successfully!');
          this.showToast.set(true);
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastMsg.set(err.error?.message || 'Verification failed.');
          this.showToast.set(true);
        }
      });
    }
  }

  onResendOtp() {
    this.resendLoading.set(true);
    this.authService.resendOtp({ email: this.email() }).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.toastMsg.set('Code resent successfully!');
        this.showToast.set(true);
      },
      error: () => {
        this.resendLoading.set(false);
        this.toastMsg.set('Failed to resend code.');
        this.showToast.set(true);
      }
    });
  }
}
