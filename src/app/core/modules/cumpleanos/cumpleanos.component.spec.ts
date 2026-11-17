import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BailarinesService } from '../../services/bailarines.service';
import { PlantillasCumpleanosService } from '../../services/plantillas-cumpleanos.service';

import { CumpleanosComponent } from './cumpleanos.component';

describe('CumpleanosComponent', () => {
  let component: CumpleanosComponent;
  let fixture: ComponentFixture<CumpleanosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CumpleanosComponent, RouterTestingModule],
      providers: [
        {
          provide: PlantillasCumpleanosService,
          useValue: {
            listar: () => of([]),
            listarTarjetasNoGeneradas: () => of([]),
            listarTarjetasListasParaPublicar: () => of([]),
            listarTarjetasPublicadas: () => of([]),
            listarCumpleanosSemana: () => of({ fecha_inicio: null, fecha_fin: null, data: [] })
          }
        },
        { provide: BailarinesService, useValue: { obtenerFotografia: () => of(new Blob()) } }
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
