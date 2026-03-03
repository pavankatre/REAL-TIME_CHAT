import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageBubbleComponent } from './message-bubble.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MessageBubbleComponent', () => {
    let component: MessageBubbleComponent;
    let fixture: ComponentFixture<MessageBubbleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageBubbleComponent, HttpClientTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(MessageBubbleComponent);
        component = fixture.componentInstance;
        // Mock input
        component.message = {
            _id: '1',
            text: 'Test message',
            sender: { _id: '1', email: 'test@example.com' },
            conversationId: '1',
            createdAt: new Date(),
            status: 'sent',
            seenBy: []
        } as any;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
