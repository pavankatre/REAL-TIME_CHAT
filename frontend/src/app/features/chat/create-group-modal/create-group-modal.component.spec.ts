import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateGroupModal } from './create-group-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CreateGroupModal', () => {
    let component: CreateGroupModal;
    let fixture: ComponentFixture<CreateGroupModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateGroupModal, HttpClientTestingModule, MatDialogModule, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: {} }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGroupModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
