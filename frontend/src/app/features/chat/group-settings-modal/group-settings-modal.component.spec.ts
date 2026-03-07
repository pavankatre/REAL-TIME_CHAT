import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupSettingsModal } from './group-settings-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GroupSettingsModal', () => {
    let component: GroupSettingsModal;
    let fixture: ComponentFixture<GroupSettingsModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GroupSettingsModal, HttpClientTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupSettingsModal);
        component = fixture.componentInstance;
        // Mocking Input data
        component.data = {
            _id: '1',
            participants: [],
            isGroup: true,
            groupName: 'Test Group',
            admin: 'admin-id'
        } as any;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
