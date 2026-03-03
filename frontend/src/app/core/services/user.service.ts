import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
    _id: string;
    email: string;
    role: string;
    avatarUrl?: string;
    bio?: string;
    nickname?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    status: string;
    lastSeen: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = environment.apiUrl + '/users';
    public userProfile = signal<UserProfile | null>(null);

    constructor(private http: HttpClient) { }

    getProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/profile`, { withCredentials: true });
    }

    updateProfile(data: { avatarUrl?: string, bio?: string, status?: string, nickname?: string, gender?: string }): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${this.apiUrl}/profile`, data, { withCredentials: true });
    }

    getUsers(): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.apiUrl}`, { withCredentials: true });
    }
}
