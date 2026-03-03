import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        const user = authService.currentUser();
        if (user && user.role === 'admin') {
            return true;
        }
        // Not an admin, redirect to home
        return router.createUrlTree(['/home']);
    }

    // Not logged in, redirect to login page
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
