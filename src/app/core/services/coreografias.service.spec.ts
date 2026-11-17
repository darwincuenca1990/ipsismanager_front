import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { constants } from '../../../assets/constants/constants';
import { CoreografiaDatos, CoreografiasService } from './coreografias.service';

describe('CoreografiasService', () => {
  let service: CoreografiasService;
  let http: HttpTestingController;
  const url = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/coreografias/`;
  const datos: CoreografiaDatos = {
    nombre: 'Danza', region: 'Sierra', descripcion: 'Descripción', url_video: 'https://example.com/video'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CoreografiasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta el listado y conserva los parámetros de paginación en el endpoint local', () => {
    service.listar('https://example.com/coreografias/?page=2').subscribe();
    const request = http.expectOne(`${url}?page=2`);
    expect(request.request.method).toBe('GET');
    request.flush({ count: 1, next: null, previous: null, results: [] });
  });

  it('crea, actualiza y elimina en las rutas del viewset', () => {
    service.crear(datos).subscribe();
    const crear = http.expectOne(url);
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual(datos);
    crear.flush({ id: 1, ...datos });

    service.actualizar(1, datos).subscribe();
    const actualizar = http.expectOne(`${url}1/`);
    expect(actualizar.request.method).toBe('PATCH');
    expect(actualizar.request.body).toEqual(datos);
    actualizar.flush({ id: 1, ...datos });

    service.eliminar(1).subscribe();
    const eliminar = http.expectOne(`${url}1/`);
    expect(eliminar.request.method).toBe('DELETE');
    eliminar.flush(null);
  });
});
