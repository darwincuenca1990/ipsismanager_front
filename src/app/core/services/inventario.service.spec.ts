import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { constants } from '../../../assets/constants/constants';
import { InventarioService, RecursoInventario } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;
  let http: HttpTestingController;
  const url = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/trajes/`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(InventarioService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta los cuatro recursos', () => {
    const recursos: RecursoInventario[] = ['tipos', 'prendas', 'composiciones', 'adquisiciones'];
    recursos.forEach(recurso => {
      service.listar(recurso).subscribe();
      const request = http.expectOne(`${url}${recurso}/`);
      expect(request.request.method).toBe('GET');
      request.flush([]);
    });
  });

  it('envía JSON sin archivos y multipart con archivos, sin modificar campos de solo lectura', () => {
    const datos = { tipo_traje: 1, fecha_adquisicion: '2026-01-01', cantidad_adquirida: 2, costo_unitario: '10.50' };
    service.guardar('adquisiciones', null, datos).subscribe();
    const crear = http.expectOne(`${url}adquisiciones/`);
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual(datos);
    crear.flush({});
    const archivo = new File(['datos'], 'foto.png', { type: 'image/png' });
    service.guardar('prendas', 7, { nombre_prenda: 'Sombrero', estado: 'ACTIVO' }, { campo: 'fotografia', valor: archivo }).subscribe();
    const editar = http.expectOne(`${url}prendas/7/`);
    expect(editar.request.method).toBe('PATCH');
    expect(editar.request.body instanceof FormData).toBeTrue();
    expect(editar.request.body.get('nombre_prenda')).toBe('Sombrero');
    const fotografia = editar.request.body.get('fotografia');
    expect(fotografia instanceof File).toBeTrue();
    expect(fotografia).toEqual(jasmine.objectContaining({
      name: archivo.name,
      size: archivo.size,
      type: archivo.type
    }));
    expect(editar.request.headers.has('Content-Type')).toBeFalse();
    editar.flush({});
  });

  it('inactiva tipos y elimina prendas y composiciones', () => {
    service.inactivarTipo(1).subscribe();
    const inactivar = http.expectOne(`${url}tipos/1/inactivar/`);
    expect(inactivar.request.method).toBe('POST');
    inactivar.flush({});
    for (const recurso of ['prendas', 'composiciones'] as const) {
      service.eliminar(recurso, 2).subscribe();
      const eliminar = http.expectOne(`${url}${recurso}/2/`);
      expect(eliminar.request.method).toBe('DELETE');
      eliminar.flush(null, { status: 204, statusText: 'No Content' });
    }
  });
});
