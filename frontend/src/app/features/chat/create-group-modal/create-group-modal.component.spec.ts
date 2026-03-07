import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateGroupModal } from './create-group-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CreateGroupModal', () => {
    let component: CreateGroupModal;
    let fixture: ComponentFixture<CreateGroupModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateGroupModal, HttpClientTestingModule, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGroupModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
