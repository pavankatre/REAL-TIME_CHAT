import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
    _id: string;
    email: string;
    nickname?: string;
    bio?: string;
    avatarUrl?: string;
    gender?: string;
    role: string;
    status?: string;
    lastSeen?: string;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = environment.apiUrl + '/users';

    constructor(private http: HttpClient) { }

    getProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/profile`, { withCredentials: true });
    }

    updateProfile(data: any): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${this.apiUrl}/profile`, data, { withCredentials: true });
    }

    getAllUsers(): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.apiUrl}`, { withCredentials: true });
    }
}
