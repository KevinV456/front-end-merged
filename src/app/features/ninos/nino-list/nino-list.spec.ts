import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NinoList } from './nino-list';

describe('NinoList', () => {
  let component: NinoList;
  let fixture: ComponentFixture<NinoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NinoList],
    }).compileComponents();

    fixture = TestBed.createComponent(NinoList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
