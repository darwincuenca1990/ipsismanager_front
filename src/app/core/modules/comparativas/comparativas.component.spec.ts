import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import type { EChartsOption } from 'echarts';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { Bailarin, BailarinesService } from '../../services/bailarines.service';
import { CoreografiasService } from '../../services/coreografias.service';
import { Presentacion, PresentacionesService, ReporteAnualPresentaciones, ReporteMensualPresentaciones } from '../../services/presentaciones.service';
import { ComparativasComponent } from './comparativas.component';
import { GraficoComparativaComponent } from './grafico-comparativa.component';

@Component({ selector: 'app-grafico-comparativa', standalone: true, template: '' })
class GraficoStubComponent {
  @Input() opciones?: EChartsOption;
  @Input() etiqueta = '';
  @Output() errorGrafico = new EventEmitter<void>();
}

describe('ComparativasComponent', () => {
  let component: ComparativasComponent;
  let fixture: ComponentFixture<ComparativasComponent>;
  let service: jasmine.SpyObj<PresentacionesService>;
  let params: BehaviorSubject<ParamMap>;
  const actual = { anio: 2026, cantidad_presentaciones: 1, ids_presentaciones: [2], costo_total_presentacion: '150.00', costo_transporte: '30.00', costo_neto: '120.00' };
  const anterior = { anio: 2025, cantidad_presentaciones: 0, ids_presentaciones: [], costo_total_presentacion: '0.00', costo_transporte: '0.00', costo_neto: '0.00' };
  const mensual: ReporteMensualPresentaciones = { mes: 10, actual, anterior };
  const anual: ReporteAnualPresentaciones = { anio: 2026, anio_anterior: 2025, meses: [mensual] };
  const presentacion: Presentacion = {
    id: 2, fecha: '2026-10-01', hora_presentacion: '10:00', lugar: 'Loja',
    persona_cargo: 1, costo_total_presentacion: '150.00', costo_transporte: '30.00',
    costo_neto: '120.00', nombre_transporte: 'Bus', tipo_presentacion: 'FESTIVALIPSIS',
    elencos: ['INFANTIL', 'PLANTA'],
    bitacora: [{ bailarin: 1, coreografias: [10] }, { bailarin: 2, coreografias: [10] }]
  };

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({}));
    service = jasmine.createSpyObj('PresentacionesService', ['reporteMensual', 'reporteAnual', 'obtener']);
    service.reporteMensual.and.returnValue(of(mensual));
    service.reporteAnual.and.returnValue(of(anual));
    service.obtener.and.returnValue(of(presentacion));
    const bailarines = jasmine.createSpyObj('BailarinesService', ['listar']);
    bailarines.listar.and.callFake(filtros => of(filtros.estado === 'ACTIVO' ? [
      { id: 1, nombres: 'Juan', apellidos: 'Paz', genero: 'MASCULINO', elenco: 'PLANTA' },
      { id: 2, nombres: 'Ana', apellidos: 'Sol', genero: 'FEMENINO', elenco: 'INFANTIL' }
    ] as Bailarin[] : []));
    const coreografias = jasmine.createSpyObj('CoreografiasService', ['listar']);
    coreografias.listar.and.returnValue(of([{ id: 10, nombre: 'Danza', region: 'Sierra', descripcion: '', url_video: '' }]));
    await TestBed.configureTestingModule({
      imports: [ComparativasComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: params.asObservable() } },
        { provide: PresentacionesService, useValue: service },
        { provide: BailarinesService, useValue: bailarines },
        { provide: CoreografiasService, useValue: coreografias }
      ]
    }).overrideComponent(ComparativasComponent, {
      remove: { imports: [GraficoComparativaComponent] },
      add: { imports: [GraficoStubComponent] }
    }).compileComponents();
    fixture = TestBed.createComponent(ComparativasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('consulta el mes y año actuales y muestra los datos comparativos', () => {
    const hoy = new Date();
    expect(service.reporteMensual).toHaveBeenCalledWith(hoy.getFullYear(), hoy.getMonth() + 1);
    expect(fixture.nativeElement.textContent).toContain('Octubre');
    expect(fixture.nativeElement.textContent).toContain('150.00');
    expect(fixture.nativeElement.textContent).toContain('120.00');
    expect(fixture.nativeElement.textContent).toContain('2025');
    expect(fixture.nativeElement.textContent).toContain('2026');
    expect(component.opcionesGrafico?.series).toEqual(jasmine.arrayContaining([
      jasmine.objectContaining({ type: 'line', data: [0, 1] })
    ]));
  });

  it('consulta el año seleccionado y muestra barras solo para los meses recibidos', () => {
    component.anioAnual = 2026;
    component.cambiarTab('anual');
    fixture.detectChanges();
    expect(service.reporteAnual).toHaveBeenCalledWith(2026);
    expect(fixture.nativeElement.querySelector('.annual-table tbody').textContent).toContain('Octubre');
    expect(component.opcionesGrafico?.xAxis).toEqual(jasmine.objectContaining({ data: ['Octubre'] }));
    expect(component.opcionesGrafico?.series).toEqual([
      jasmine.objectContaining({ type: 'bar', name: '2025', data: [0] }),
      jasmine.objectContaining({ type: 'bar', name: '2026', data: [1] })
    ]);
    component.metrica = 'costo_neto';
    component.actualizarGrafico();
    expect(component.opcionesGrafico?.series).toEqual([
      jasmine.objectContaining({ data: [0] }),
      jasmine.objectContaining({ data: [120] })
    ]);
  });

  it('abre el reporte anual cuando se indica en la ruta y responde a cambios posteriores', () => {
    service.reporteMensual.calls.reset();
    params.next(convertToParamMap({ tab: 'anual' }));
    fixture.detectChanges();
    expect(component.tab).toBe('anual');
    expect(service.reporteAnual).toHaveBeenCalledWith(new Date().getFullYear());
    expect(service.reporteMensual).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#tab-anual').getAttribute('aria-selected')).toBe('true');
    params.next(convertToParamMap({ tab: 'mensual' }));
    expect(component.tab).toBe('mensual');
    expect(service.reporteMensual).toHaveBeenCalled();
  });

  it('consulta directamente el reporte anual al iniciar con el parámetro', () => {
    fixture.destroy();
    params.next(convertToParamMap({ tab: 'anual' }));
    service.reporteMensual.calls.reset();
    service.reporteAnual.calls.reset();
    fixture = TestBed.createComponent(ComparativasComponent);
    fixture.detectChanges();
    expect(service.reporteMensual).not.toHaveBeenCalled();
    expect(service.reporteAnual).toHaveBeenCalledOnceWith(new Date().getFullYear());
    expect(fixture.componentInstance.tab).toBe('anual');
  });

  it('cancela solicitudes previas y muestra el error sin datos antiguos', () => {
    const pendiente = new Subject<ReporteMensualPresentaciones>();
    service.reporteMensual.and.returnValue(pendiente);
    component.consultar();
    expect(component.mensual).toBeNull();
    service.reporteAnual.and.returnValue(throwError(() => new Error('Error')));
    component.cambiarTab('anual');
    expect(pendiente.observed).toBeFalse();
    expect(component.error).toContain('reporte anual');
    expect(component.cargando).toBeFalse();
    expect(component.opcionesGrafico).toBeNull();
  });

  it('presenta un mensaje cuando el gráfico falla sin ocultar la tabla', () => {
    component.errorGrafico = 'No se pudo mostrar el gráfico.';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo mostrar el gráfico.');
    expect(fixture.nativeElement.querySelector('.report-table')).toBeTruthy();
  });

  it('permite abrir cada ID del reporte mensual y muestra un guion para una lista vacía', () => {
    component.mensual = { ...mensual, actual: { ...actual, ids_presentaciones: [2, 3] } };
    fixture.detectChanges();
    const fila: HTMLTableRowElement = fixture.nativeElement.querySelector('.report-table tbody tr:last-child');
    expect(fila.cells[1].textContent?.trim()).toBe('—');
    const botones = fila.cells[2].querySelectorAll('button');
    expect(botones.length).toBe(2);
    botones[1].click();
    expect(service.obtener).toHaveBeenCalledWith(3);
  });

  it('permite abrir los IDs anteriores y actuales del reporte anual', () => {
    service.reporteAnual.and.returnValue(of({
      ...anual, meses: [{ ...mensual, anterior: { ...anterior, ids_presentaciones: [7] } }]
    }));
    component.cambiarTab('anual');
    fixture.detectChanges();
    const botones: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.annual-table tbody .id-link');
    expect(botones.length).toBe(2);
    botones[0].click();
    expect(service.obtener).toHaveBeenCalledWith(7);
    component.cerrarDetalle();
    botones[1].click();
    expect(service.obtener).toHaveBeenCalledWith(2);
  });

  it('abre el detalle agrupado en comparativas y conserva el reporte al cerrar', () => {
    component.cambiarTab('anual');
    component.anioAnual = 2024;
    component.metrica = 'costo_neto';
    const reporte = component.anual;
    component.verDetalle(2);
    fixture.detectChanges();
    const detalle: HTMLElement = fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]');
    expect(detalle.textContent).toContain('Loja');
    expect(detalle.querySelectorAll('.elenco-separator').length).toBe(2);
    expect(detalle.querySelector('input, select, textarea, form')).toBeNull();
    detalle.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]')).toBeNull();
    expect(component.tab).toBe('anual');
    expect(component.anioAnual).toBe(2024);
    expect(component.metrica).toBe('costo_neto');
    expect(component.anual).toBe(reporte);
  });

  it('muestra errores, permite reintentar y cancela las solicitudes pendientes', () => {
    service.obtener.and.returnValue(throwError(() => new Error('Error')));
    component.verDetalle(2);
    fixture.detectChanges();
    expect(component.errorDetalle).toContain('No se pudo cargar');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    const pendiente = new Subject<Presentacion>();
    service.obtener.and.returnValue(pendiente);
    component.reintentarDetalle();
    expect(pendiente.observed).toBeTrue();
    component.cerrarDetalle();
    expect(pendiente.observed).toBeFalse();
    expect(component.cargandoDetalle).toBeFalse();
    expect(component.errorDetalle).toBe('');
  });

  it('no muestra un detalle incompleto si falla la carga de catálogos', () => {
    TestBed.inject(BailarinesService).listar = jasmine.createSpy().and.returnValue(
      throwError(() => new Error('Error de catálogo'))
    );
    component.verDetalle(2);
    fixture.detectChanges();
    expect(component.errorDetalle).toContain('catálogos');
    expect(component.detalle).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]')).toBeNull();
  });
});
