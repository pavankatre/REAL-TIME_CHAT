import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nickname: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    const control = g.get('confirmPassword');

    if (password !== confirmPassword) {
      control?.setErrors({ ...control.errors, 'mismatch': true });
      return { 'mismatch': true };
    } else {
      // If they match, we need to remove our 'mismatch' error but keep others (like required)
      if (control?.hasError('mismatch')) {
        const errors = { ...control.errors };
        delete errors['mismatch'];
        control.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  }

  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      // Extract only the fields needed by the backend
      const { email, password, nickname, gender } = this.registerForm.value;
      const payload = { email, password, nickname, gender };

      this.authService.register(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          // Pass the email in state so OTP component doesn't need to ask for it again
          this.router.navigate(['/otp'], { state: { email } });
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        }
      });
    }
  }
}
