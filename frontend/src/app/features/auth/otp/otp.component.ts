import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-otp',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './otp.component.html',
    styleUrl: './otp.component.css'
})
export class OtpComponent implements OnInit, OnDestroy {
    otpForm: FormGroup;
    email: string | null = null;
    maskedEmail = signal('');

    isLoading = signal(false);
    isResending = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    resendCountdown = signal(60); // 60s cooldown
    private timer: any;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]{6}$')]]
        });

        // Get email from router state
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state && navigation.extras.state['email']) {
            this.email = navigation.extras.state['email'];
            this.maskEmailString(this.email!);
        } else if (history.state && history.state.email) {
            this.email = history.state.email;
            this.maskEmailString(this.email!);
        }
    }

    ngOnInit(): void {
        if (!this.email) {
            // If no email in state, they shouldn't be here
            this.router.navigate(['/login']);
            return;
        }
        this.startResendTimer();
    }

    ngOnDestroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    private maskEmailString(email: string) {
        const [name, domain] = email.split('@');
        if (name.length > 2) {
            this.maskedEmail.set(`${name.substring(0, 2)}${'*'.repeat(name.length - 2)}@${domain}`);
        } else {
            this.maskedEmail.set(email);
        }
    }

    startResendTimer() {
        this.resendCountdown.set(60);
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            const current = this.resendCountdown();
            if (current > 0) {
                this.resendCountdown.set(current - 1);
            } else {
                clearInterval(this.timer);
            }
        }, 1000);
    }

    resendOtp() {
        if (!this.email || this.resendCountdown() > 0) return;

        this.isResending.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        this.authService.resendOtp({ email: this.email }).subscribe({
            next: (res) => {
                this.isResending.set(false);
                this.successMessage.set(res.message || 'OTP Resent!');
                this.startResendTimer();
            },
            error: (err: any) => {
                this.isResending.set(false);
                this.errorMessage.set(err.error?.message || 'Failed to resend OTP.');
                if (err.status === 429) {
                    // If backend says rate limit, sync timer to backend roughly
                    this.startResendTimer();
                }
            }
        });
    }

    onSubmit() {
        if (this.otpForm.valid && this.email) {
            this.isLoading.set(true);
            this.errorMessage.set(null);
            this.successMessage.set(null);

            this.authService.verifyOtp({ email: this.email, otp: this.otpForm.value.otp }).subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.successMessage.set('Verification successful! Redirecting to login...');
                    setTimeout(() => this.router.navigate(['/login']), 1500);
                },
                error: (err: any) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Verification failed. Please check your OTP.');
                    this.otpForm.reset();
                }
            });
        }
    }
}
