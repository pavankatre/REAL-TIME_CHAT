import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

export interface User {
    id: string;
    email: string;
    role: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl + '/auth';
    public isAuthenticated = signal<boolean>(this.hasToken());
    public isLoggedIn$ = toObservable(this.isAuthenticated);
    public currentUser = signal<User | null>(this.getUserFromStorage());

    constructor(private http: HttpClient, private router: Router) { }

    private hasToken(): boolean {
        return !!localStorage.getItem('access_token');
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    setAuth(accessToken: string, user?: User) {
        localStorage.setItem('access_token', accessToken);
        if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
            this.currentUser.set(user);
        }
        this.isAuthenticated.set(true);
    }

    clearAuth() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    verifyOtp(data: { email: string; otp: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/verify-otp`, data);
    }

    resendOtp(data: { email: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/resend-otp`, data);
    }

    login(credentials: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
            tap({
                next: (res) => {
                    if (res.accessToken) {
                        this.setAuth(res.accessToken, res.user);
                    }
                },
                error: (err) => {
                    if (err.error?.message === 'Please verify your email first') {
                        console.warn(`[AuthService] Login attempt with unverified email: ${credentials.email}`);
                    } else {
                        console.error(`[AuthService] Login failed for ${credentials.email}:`, err.error?.message || err.message);
                    }
                }
            })
        );
    }

    refreshToken(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
            tap(res => {
                if (res.accessToken) {
                    this.setAuth(res.accessToken);
                }
            })
        );
    }

    forgotPassword(data: { email: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, data);
    }

    resetPassword(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, data);
    }

    logout() {
        this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
            next: () => this.handleLogout(),
            error: () => this.handleLogout() // Clear local state even if server fails
        });
    }

    private handleLogout() {
        this.clearAuth();
        this.router.navigate(['/login']);
    }
}
