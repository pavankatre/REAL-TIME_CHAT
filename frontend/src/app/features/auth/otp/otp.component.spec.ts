import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OtpComponent } from './otp.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('OtpComponent', () => {
    let component: OtpComponent;
    let fixture: ComponentFixture<OtpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                OtpComponent,
                HttpClientTestingModule,
                RouterTestingModule,
                ReactiveFormsModule,
                NoopAnimationsModule
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OtpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
