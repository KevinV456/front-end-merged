import { TestBed } from '@angular/core/testing';

import { Nino } from './nino';

describe('Nino', () => {
  let service: Nino;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Nino);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
