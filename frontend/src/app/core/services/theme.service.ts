import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal<boolean>(this.getInitialTheme());

    constructor() {
        // Apply theme whenever isDarkMode changes
        effect(() => {
            const dark = this.isDarkMode();
            if (dark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        });
    }

    toggleTheme() {
        this.isDarkMode.update(dark => !dark);
    }

    private getInitialTheme(): boolean {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}
