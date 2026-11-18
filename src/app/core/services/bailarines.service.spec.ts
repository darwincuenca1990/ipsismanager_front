import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { constants } from '../../../assets/constants/constants';
import { BailarinesService } from './bailarines.service';

describe('BailarinesService', () => {
  let service: BailarinesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BailarinesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene y asigna solo los géneros de un parámetro activo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerGeneros().subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/GENERO`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 9,
      nombre: 'GENERO',
      valor: 'Masculino, Femenino',
      estado: 'ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Masculino', value: 'MASCULINO' },
      { label: 'Femenino', value: 'FEMENINO' }
    ]);
  });

  it('no asigna géneros cuando el parámetro está inactivo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerGeneros().subscribe(resultado => opciones = resultado);

    http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/GENERO`
    ).flush({
      id: 9,
      nombre: 'GENERO',
      valor: 'Masculino, Femenino',
      estado: 'INACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([]);
  });
});
