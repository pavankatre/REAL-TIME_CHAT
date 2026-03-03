import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile } from './user.service';

export interface Message {
    _id: string;
    conversationId: string;
    sender: UserProfile;
    text: string;
    status: 'sent' | 'delivered' | 'seen';
    seenBy: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    _id: string;
    participants: UserProfile[];
    lastMessage?: Message;
    isGroup: boolean;
    groupName?: string;
    admin?: string; // ObjectId string
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedMessages {
    messages: Message[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = environment.apiUrl + '/chat';

    // State Management
    public conversations = signal<Conversation[]>([]);
    public activeConversationId = signal<string | null>(null);
    public activeMessages = signal<Message[]>([]);

    constructor(private http: HttpClient) { }

    searchUsers(query: string): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.apiUrl}/search?q=${query}`, { withCredentials: true });
    }

    getConversations(): Observable<Conversation[]> {
        return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`, { withCredentials: true });
    }

    getOrCreateConversation(targetUserId: string): Observable<Conversation> {
        return this.http.post<Conversation>(`${this.apiUrl}/conversations`, { targetUserId }, { withCredentials: true });
    }

    createGroup(groupName: string, participants: string[]): Observable<Conversation> {
        return this.http.post<Conversation>(`${this.apiUrl}/groups`, { groupName, participants }, { withCredentials: true });
    }

    updateGroup(conversationId: string, data: { groupName?: string, addParticipants?: string[], removeParticipants?: string[] }): Observable<Conversation> {
        return this.http.put<Conversation>(`${this.apiUrl}/groups/${conversationId}`, data, { withCredentials: true });
    }

    getMessages(conversationId: string, page: number = 1, limit: number = 20): Observable<PaginatedMessages> {
        return this.http.get<PaginatedMessages>(`${this.apiUrl}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, { withCredentials: true });
    }
}
