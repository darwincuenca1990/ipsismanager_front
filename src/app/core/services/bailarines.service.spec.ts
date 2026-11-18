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

  it('obtiene elencos separados por coma y asigna solo valores activos', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerElencos().subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/ELENCO`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 10,
      nombre: 'ELENCO',
      valor: 'INFANTIL, PLANTA, MÁSTER, ASPIRANTE INFANTIL, ASPIRANTE PLANTA, ASPIRANTE MÁSTER',
      estado: 'ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Infantil', value: 'INFANTIL' },
      { label: 'Planta', value: 'PLANTA' },
      { label: 'Máster', value: 'MÁSTER' },
      { label: 'Aspirante Infantil', value: 'ASPIRANTE INFANTIL' },
      { label: 'Aspirante Planta', value: 'ASPIRANTE PLANTA' },
      { label: 'Aspirante Máster', value: 'ASPIRANTE MÁSTER' }
    ]);
  });

  it('no asigna elencos cuando el parámetro está inactivo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerElencos().subscribe(resultado => opciones = resultado);

    http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/ELENCO`
    ).flush({
      id: 10,
      nombre: 'ELENCO',
      valor: 'Infantil, Planta',
      estado: 'INACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([]);
  });

  it('obtiene elencos de presentación desde el parámetro activo correspondiente', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerElencosPresentacion().subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/ELENCOS_PRESENTACION`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 15,
      nombre: 'ELENCOS_PRESENTACION',
      valor: 'Infantil, Planta, Máster',
      estado: ' ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Infantil', value: 'INFANTIL' },
      { label: 'Planta', value: 'PLANTA' },
      { label: 'Máster', value: 'MÁSTER' }
    ]);
  });

  it('obtiene opciones de convivencia de un parámetro activo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerOpcionesConvivencia().subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/CONVIVE_CON`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 11,
      nombre: 'CONVIVE_CON',
      valor: 'PADRES, FAMILIARES, OTROS',
      estado: 'ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Padres', value: 'PADRES' },
      { label: 'Familiares', value: 'FAMILIARES' },
      { label: 'Otros', value: 'OTROS' }
    ]);
  });

  it('no asigna opciones de convivencia cuando el parámetro está inactivo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerOpcionesConvivencia().subscribe(resultado => opciones = resultado);

    http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/CONVIVE_CON`
    ).flush({
      id: 11,
      nombre: 'CONVIVE_CON',
      valor: 'PADRES, FAMILIARES, OTROS',
      estado: 'INACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([]);
  });

  it('obtiene opciones de estado de un parámetro activo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerEstados().subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/ESTADO`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 12,
      nombre: 'ESTADO',
      valor: 'ACTIVO, INACTIVO',
      estado: 'ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Activo', value: 'ACTIVO' },
      { label: 'Inactivo', value: 'INACTIVO' }
    ]);
  });

  it('no asigna opciones de estado cuando el parámetro está inactivo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerEstados().subscribe(resultado => opciones = resultado);

    http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/ESTADO`
    ).flush({
      id: 12,
      nombre: 'ESTADO',
      valor: 'ACTIVO, INACTIVO',
      estado: 'INACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([]);
  });

  it('obtiene opciones de tipo de presentación del parámetro activo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerOpcionesParametro('TIPOS_PRESENTACION').subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/TIPOS_PRESENTACION`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 14,
      nombre: 'TIPOS_PRESENTACION',
      valor: 'Un elenco, Festival Ipsis',
      estado: 'ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Un Elenco', value: 'UN ELENCO' },
      { label: 'Festival Ipsis', value: 'FESTIVAL IPSIS' }
    ]);
  });

  it('obtiene las clases de presentación activas conservando su valor original', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerClasesPresentacion().subscribe(resultado => opciones = resultado);

    const request = http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/CLASE_PRESENTACION`
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 16,
      nombre: 'CLASE_PRESENTACION',
      valor: 'Pagada, Colaboración, Festivales, Concursos',
      estado: 'ACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([
      { label: 'Pagada', value: 'Pagada' },
      { label: 'Colaboración', value: 'Colaboración' },
      { label: 'Festivales', value: 'Festivales' },
      { label: 'Concursos', value: 'Concursos' }
    ]);
  });

  it('no asigna clases de presentación cuando el parámetro está inactivo', () => {
    let opciones: { label: string; value: string }[] | undefined;
    service.obtenerClasesPresentacion().subscribe(resultado => opciones = resultado);

    http.expectOne(
      `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/parametros/por-nombre/CLASE_PRESENTACION`
    ).flush({
      id: 16,
      nombre: 'CLASE_PRESENTACION',
      valor: 'Pagada, Colaboración',
      estado: 'INACTIVO',
      fecha_registro: '2026-11-12T16:05:53.246396Z'
    });

    expect(opciones).toEqual([]);
  });
});
