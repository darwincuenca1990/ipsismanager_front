import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PlantillasCumpleanosService } from '../../services/plantillas-cumpleanos.service';

import { CumpleanosComponent } from './cumpleanos.component';

describe('CumpleanosComponent', () => {
  let component: CumpleanosComponent;
  let fixture: ComponentFixture<CumpleanosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CumpleanosComponent],
      providers: [
        { provide: PlantillasCumpleanosService, useValue: { listar: () => of([]) } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CumpleanosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
