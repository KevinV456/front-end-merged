import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NinoForm } from './nino-form';

describe('NinoForm', () => {
  let component: NinoForm;
  let fixture: ComponentFixture<NinoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NinoForm],
    }).compileComponents();

    fixture = TestBed.createComponent(NinoForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
