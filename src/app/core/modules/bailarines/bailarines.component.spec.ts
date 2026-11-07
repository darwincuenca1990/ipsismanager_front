import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BailarinesService } from '../../services/bailarines.service';
import { CommonsService } from '../../services/commons.service';

import { BailarinesComponent } from './bailarines.component';

describe('BailarinesComponent', () => {
  let component: BailarinesComponent;
  let fixture: ComponentFixture<BailarinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BailarinesComponent],
      providers: [
        { provide: BailarinesService, useValue: { listar: () => of([]) } },
        { provide: CommonsService, useValue: { opcionesElenco: [] } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BailarinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
