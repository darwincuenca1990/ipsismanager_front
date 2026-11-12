import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { PresentacionesService, ReporteAnualPresentaciones, ReporteMensualPresentaciones } from '../../services/presentaciones.service';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let presentacionesService: jasmine.SpyObj<PresentacionesService>;
  const resumenMes = (cantidad: number, anio: number) => ({
    anio, cantidad_presentaciones: cantidad, ids_presentaciones: [],
    costo_total_presentacion: '0', costo_transporte: '0', costo_neto: '0'
  });
  const reporte: ReporteAnualPresentaciones = {
    anio: new Date().getFullYear(),
    anio_anterior: new Date().getFullYear() - 1,
    meses: [
      { mes: 1, actual: resumenMes(3, new Date().getFullYear()), anterior: resumenMes(4, new Date().getFullYear() - 1) },
      { mes: 12, actual: resumenMes(2, new Date().getFullYear()), anterior: resumenMes(7, new Date().getFullYear() - 1) }
    ]
  };
  const reporteMensual: ReporteMensualPresentaciones = {
    mes: new Date().getMonth() + 1,
    actual: resumenMes(0, new Date().getFullYear()),
    anterior: resumenMes(7, new Date().getFullYear() - 1)
  };

  beforeEach(async () => {
    presentacionesService = jasmine.createSpyObj('PresentacionesService', ['reporteAnual', 'reporteMensual']);
    presentacionesService.reporteAnual.and.returnValue(of(reporte));
    presentacionesService.reporteMensual.and.returnValue(of(reporteMensual));
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PresentacionesService, useValue: presentacionesService },
        { provide: DashboardService, useValue: { obtenerResumen: () => of({
          bailarines: {
            totalActivos: 0,
            totalInactivos: 0,
            porElenco: {
              INFANTIL: { activos: 0, inactivos: 0 },
              PLANTA: { activos: 0, inactivos: 0 },
              'MÁSTER': { activos: 0, inactivos: 0 }
            }
          },
          cumpleanosMes: [],
          cumpleanosSemana: []
        }), obtenerPresentacionesPorMes: () => of(null) } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra la suma anual de ambos años y enlaza al reporte anual', () => {
    expect(presentacionesService.reporteAnual).toHaveBeenCalledWith(component.hoy.getFullYear());
    const enlace: HTMLAnchorElement = fixture.nativeElement.querySelector('.comparison-link');
    expect(enlace.getAttribute('href')).toBe('/comparativas?tab=anual');
    const valores = enlace.querySelectorAll('.comparison-values strong');
    expect(valores[0].textContent?.trim()).toBe('5');
    expect(valores[1].textContent?.trim()).toBe('11');
    expect(enlace.textContent).toContain('todos los meses');
  });

  it('muestra ceros cuando el reporte anual no tiene meses', () => {
    presentacionesService.reporteAnual.and.returnValue(of({ ...reporte, meses: [] }));
    component.cargarTotalesAnuales();
    expect(component.totalesAnuales).toEqual({ actual: 0, anterior: 0 });
  });

  it('muestra las cantidades del mes actual y enlaza al reporte mensual', () => {
    expect(presentacionesService.reporteMensual).toHaveBeenCalledWith(
      component.hoy.getFullYear(), component.hoy.getMonth() + 1
    );
    const enlace: HTMLAnchorElement = fixture.nativeElement.querySelector('.monthly-comparison-link');
    expect(enlace.getAttribute('href')).toBe('/comparativas?tab=mensual');
    const valores = enlace.querySelectorAll('.comparison-values strong');
    expect(valores[0].textContent?.trim()).toBe('0');
    expect(valores[1].textContent?.trim()).toBe('7');
    expect(enlace.textContent).toContain(`${component.mesActual} ${component.hoy.getFullYear()}`);
    expect(enlace.textContent).toContain(`${component.mesActual} ${component.anioAnterior}`);
  });

  it('cancela solicitudes mensuales anteriores y permite reintentar un error', () => {
    const pendiente = new Subject<ReporteMensualPresentaciones>();
    presentacionesService.reporteMensual.and.returnValue(pendiente);
    component.cargarTotalesMensuales();
    expect(component.cargandoTotalesMensuales).toBeTrue();
    presentacionesService.reporteMensual.and.returnValue(throwError(() => new Error('Error')));
    component.cargarTotalesMensuales();
    fixture.detectChanges();
    expect(pendiente.observed).toBeFalse();
    expect(component.totalesMensuales).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los totales mensuales.');
    presentacionesService.reporteMensual.and.returnValue(of(reporteMensual));
    fixture.nativeElement.querySelector('.presentations-card [role="alert"] button').click();
    fixture.detectChanges();
    expect(component.errorTotalesMensuales).toBe('');
    expect(component.totalesMensuales).toEqual({ actual: 0, anterior: 7 });
  });

  it('cancela solicitudes anteriores y permite reintentar un error', () => {
    const pendiente = new Subject<ReporteAnualPresentaciones>();
    presentacionesService.reporteAnual.and.returnValue(pendiente);
    component.cargarTotalesAnuales();
    expect(component.cargandoTotalesAnuales).toBeTrue();
    presentacionesService.reporteAnual.and.returnValue(throwError(() => new Error('Error')));
    component.cargarTotalesAnuales();
    fixture.detectChanges();
    expect(pendiente.observed).toBeFalse();
    expect(component.totalesAnuales).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los totales anuales.');
    presentacionesService.reporteAnual.and.returnValue(of(reporte));
    fixture.nativeElement.querySelector('.presentations-card [role="alert"] button').click();
    fixture.detectChanges();
    expect(component.errorTotalesAnuales).toBe('');
    expect(component.totalesAnuales).toEqual({ actual: 5, anterior: 11 });
  });
});
