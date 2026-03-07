import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { PushNotificationService } from './core/services/push-notification.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('frontend');
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private pushService = inject(PushNotificationService);

  constructor() {
    // Only subscribe to push if user is logged in or when they log in
    this.authService.isLoggedIn$.pipe(
      filter((loggedIn: boolean) => !!loggedIn),
      take(1) // Just once per session is usually enough for auto-registration
    ).subscribe(() => {
      this.pushService.initAndSubscribe();
    });
  }
}
