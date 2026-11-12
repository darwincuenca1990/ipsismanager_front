import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { constants } from '../../../assets/constants/constants';
import { BailarinesService } from './bailarines.service';
import { PresentacionDatos, PresentacionesService } from './presentaciones.service';

describe('PresentacionesService', () => {
  let service: PresentacionesService;
  let http: HttpTestingController;
  const url = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/presentaciones/`;
  const datos: PresentacionDatos = {
    fecha: '2026-11-11', lugar: 'Loja', hora_presentacion: '10:00', persona_cargo: 1,
    costo_total_presentacion: '100.00', costo_transporte: '20.00', nombre_transporte: 'Bus',
    tipo_presentacion: 'UN ELENCO', elencos: ['PLANTA'], bitacora: [{ bailarin: 1, coreografias: [3] }]
  };
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PresentacionesService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta filtros, páginas y detalle', () => {
    service.listar({ mes: 11, anio: 2026, lugar: 'Loja' }).subscribe();
    const lista = http.expectOne(req => req.url === url && req.params.get('mes') === '11' && req.params.get('anio') === '2026' && req.params.get('lugar') === 'Loja');
    expect(lista.request.method).toBe('GET');
    lista.flush([]);
    service.listar({}, 'https://example.com/presentaciones/?page=2').subscribe();
    http.expectOne(`${url}?page=2`).flush([]);
    service.obtener(7).subscribe();
    http.expectOne(`${url}7/`).flush({ id: 7, ...datos });
  });

  it('consulta los reportes mensual y anual con los parámetros correspondientes', () => {
    service.reporteMensual(2026, 10).subscribe();
    const mensual = http.expectOne(req => req.url === `${url}reporte-mensual/`
      && req.params.get('anio') === '2026' && req.params.get('mes') === '10');
    expect(mensual.request.method).toBe('GET');
    mensual.flush({ mes: 10 });
    service.reporteAnual(2026).subscribe();
    const anual = http.expectOne(req => req.url === `${url}reporte-anual/`
      && req.params.get('anio') === '2026' && !req.params.has('mes'));
    expect(anual.request.method).toBe('GET');
    anual.flush({ anio: 2026, anio_anterior: 2025, meses: [] });
  });

  it('envía el formato del serializer al crear y editar', () => {
    service.crear(datos).subscribe();
    const crear = http.expectOne(url);
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual(datos);
    crear.flush({ id: 7, ...datos });
    service.actualizar(7, datos).subscribe();
    const actualizar = http.expectOne(`${url}7/`);
    expect(actualizar.request.method).toBe('PATCH');
    expect(actualizar.request.body).toEqual(datos);
    actualizar.flush({ id: 7, ...datos });
  });

  it('conserva los filtros de bailarines al seguir una página', () => {
    const bailarines = TestBed.inject(BailarinesService);
    bailarines.listar({ elenco: 'todos', estado: 'ACTIVO' }, 'https://example.com/bailarines/?page=2').subscribe();
    const request = http.expectOne(req => req.url === `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/bailarines/`
      && req.params.get('page') === '2' && req.params.get('elenco') === 'todos' && req.params.get('estado') === 'ACTIVO');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
