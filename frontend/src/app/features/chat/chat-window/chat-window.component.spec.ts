import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatWindowComponent } from './chat-window.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChatWindowComponent', () => {
    let component: ChatWindowComponent;
    let fixture: ComponentFixture<ChatWindowComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChatWindowComponent, HttpClientTestingModule, RouterTestingModule, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(ChatWindowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
