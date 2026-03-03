import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupSettingsModal } from './group-settings-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

describe('GroupSettingsModal', () => {
    let component: GroupSettingsModal;
    let fixture: ComponentFixture<GroupSettingsModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GroupSettingsModal, HttpClientTestingModule, MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: { participants: [] } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupSettingsModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
