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

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatIconModule],
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
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.isLoading.set(false);
          // Pass the email in state so OTP component doesn't need to ask for it again
          this.router.navigate(['/otp'], { state: { email: this.registerForm.value.email } });
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        }
      });
    }
  }
}
