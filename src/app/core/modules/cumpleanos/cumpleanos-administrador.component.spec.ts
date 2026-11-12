import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { PlantillasCumpleanosService, TarjetaConPublicaciones, TarjetaCumpleanos } from '../../services/plantillas-cumpleanos.service';
import { CumpleanosAdministradorComponent } from './cumpleanos-administrador.component';

describe('CumpleanosAdministradorComponent', () => {
  let component: CumpleanosAdministradorComponent;
  let service: jasmine.SpyObj<PlantillasCumpleanosService>;
  const tarjeta: TarjetaCumpleanos = {
    id: 1, bailarin: { id: 1, nombres: 'Ana', apellidos: 'Paz' },
    anio: 2026, mensaje_generado: '', estado_generacion: 'NO_GENERADA',
    motivo_no_generacion: '', estado: 'PENDIENTE', observaciones: ''
  };
  const resultado = { fecha: '2026-01-01', generadas: [], omitidas: [], ya_existentes: [] };

  beforeEach(() => {
    service = jasmine.createSpyObj('PlantillasCumpleanosService', [
      'listarTarjetasNoGeneradas', 'listarTarjetasListasParaPublicar',
      'listarTarjetasPublicadas', 'ejecutarDetector', 'generarTarjetaManualmente'
    ]);
    service.listarTarjetasNoGeneradas.and.returnValue(of([tarjeta]));
    service.listarTarjetasListasParaPublicar.and.returnValue(of([]));
    service.listarTarjetasPublicadas.and.returnValue(of([]));
    component = new CumpleanosAdministradorComponent(new FormBuilder(), service);
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('actualiza las listas iniciales al completar el detector y conserva el resultado', () => {
    const detector = new Subject<unknown>();
    service.ejecutarDetector.and.returnValue(detector);
    service.listarTarjetasNoGeneradas.and.returnValue(of([]));
    service.listarTarjetasListasParaPublicar.and.returnValue(of([{ ...tarjeta, estado_generacion: 'GENERADA' }]));
    component.tabActiva = 'publicados';
    component.probarDetector();
    detector.next(resultado);
    expect(service.listarTarjetasNoGeneradas).toHaveBeenCalledTimes(1);
    expect(component.probandoDetector).toBeTrue();
    detector.complete();
    expect(service.listarTarjetasNoGeneradas).toHaveBeenCalledTimes(2);
    expect(service.listarTarjetasListasParaPublicar).toHaveBeenCalledTimes(2);
    expect(service.listarTarjetasPublicadas).toHaveBeenCalledTimes(2);
    expect(component.tarjetasNoGeneradas.length).toBe(0);
    expect(component.tarjetasAprobadas[0].id).toBe(1);
    expect(component.resultadoDetector).toEqual(resultado);
    expect(component.detectorEjecutado).toBeTrue();
    expect(component.tabActiva).toBe('publicados');
    expect(component.probandoDetector).toBeFalse();
  });

  it('mantiene el error del detector y no recarga cuando falla', () => {
    service.ejecutarDetector.and.returnValue(throwError(() => new Error('Error')));
    component.probarDetector();
    expect(service.listarTarjetasNoGeneradas).toHaveBeenCalledTimes(1);
    expect(component.error).toContain('No se pudo ejecutar el detector');
    expect(component.probandoDetector).toBeFalse();
  });

  it('cancela una carga anterior y muestra los errores de actualización', () => {
    const pendiente = new Subject<TarjetaCumpleanos[]>();
    service.listarTarjetasNoGeneradas.and.returnValue(pendiente);
    component.cargarTarjetas();
    service.listarTarjetasNoGeneradas.and.returnValue(throwError(() => new Error('Error')));
    component.cargarTarjetas();
    expect(pendiente.observed).toBeFalse();
    expect(component.cargando).toBeFalse();
    expect(component.error).toContain('No se pudieron cargar las tarjetas no generadas');
  });

  it('finaliza la carga si falla la consulta de tarjetas listas', () => {
    service.listarTarjetasListasParaPublicar.and.returnValue(throwError(() => new Error('Error')));
    component.cargarTarjetas();
    expect(component.cargando).toBeFalse();
    expect(component.error).toContain('No se pudieron cargar las tarjetas listas para publicar');
  });

  it('deshabilita el formulario durante la solicitud y muestra el detalle del error para reintentar', () => {
    const solicitud = new Subject<TarjetaConPublicaciones>();
    service.generarTarjetaManualmente.and.returnValue(solicitud);
    component.abrirFormularioGeneracion({ ...tarjeta });
    const imagen = new File(['imagen'], 'afiche.png', { type: 'image/png' });
    component.formGeneracion.patchValue({ imagen, mensaje_generado: 'Feliz cumpleaños' });
    component.generarTarjetaManualmente();
    expect(service.generarTarjetaManualmente).toHaveBeenCalledOnceWith(tarjeta.id, {
      imagen, mensaje_generado: 'Feliz cumpleaños'
    });
    expect(component.formGeneracion.disabled).toBeTrue();
    component.cerrarFormularioGeneracion();
    expect(component.mostrarFormularioGeneracion).toBeTrue();
    component.generarTarjetaManualmente();
    expect(service.generarTarjetaManualmente).toHaveBeenCalledTimes(1);
    solicitud.error({ error: { imagen: ['Formato no permitido'] } });
    expect(component.formGeneracion.enabled).toBeTrue();
    expect(component.formGeneracion.controls.mensaje_generado.value).toBe('Feliz cumpleaños');
    expect(component.errorFormulario).toContain('Formato no permitido');
    expect(component.tarjetaSeleccionada?.cargandoGeneracion).toBeFalse();
  });
});
