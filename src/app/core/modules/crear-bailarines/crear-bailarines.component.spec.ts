import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearBailarinesComponent } from './crear-bailarines.component';

describe('CrearBailarinesComponent', () => {
  let component: CrearBailarinesComponent;
  let fixture: ComponentFixture<CrearBailarinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearBailarinesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrearBailarinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
