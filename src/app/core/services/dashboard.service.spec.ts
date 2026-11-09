import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BailarinesService } from './bailarines.service';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: BailarinesService, useValue: { listar: () => of([]) } }]
    });
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('counts elencos and finds birthdays this week and month', done => {
    const active = [
      { id: 1, nombres: 'Luz', apellidos: 'Sol', elenco: 'INFANTIL', fecha_nacimiento: '2015-06-16' },
      { id: 2, nombres: 'Ana', apellidos: 'Paz', elenco: 'ASPIRANTE PLANTA', fecha_nacimiento: '2000-06-25' }
    ];
    const inactive = [
      { id: 3, nombres: 'Eva', apellidos: 'Luz', elenco: 'MÁSTER', fecha_nacimiento: '1990-01-02' }
    ];
    const bailarinesService = TestBed.inject(BailarinesService) as jasmine.SpyObj<BailarinesService>;
    spyOn(bailarinesService, 'listar').and.callFake(({ estado }) => of(estado === 'ACTIVO' ? active : inactive));

    service.obtenerResumen(new Date(2026, 5, 15)).subscribe(resumen => {
      expect(resumen.bailarines.totalActivos).toBe(2);
      expect(resumen.bailarines.totalInactivos).toBe(1);
      expect(resumen.bailarines.porElenco.INFANTIL.activos).toBe(1);
      expect(resumen.bailarines.porElenco.PLANTA.activos).toBe(1);
      expect(resumen.bailarines.porElenco['MÁSTER'].inactivos).toBe(1);
      expect(resumen.cumpleanosSemana.map(persona => persona.id)).toEqual([1]);
      expect(resumen.cumpleanosMes.map(persona => persona.id)).toEqual([1, 2]);
      done();
    });
  });
});
