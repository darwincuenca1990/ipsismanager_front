import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService, ElencoDashboard, PresentacionesResumen, ResumenDashboard } from '../../services/dashboard.service';
import { PresentacionesService } from '../../services/presentaciones.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  resumen: ResumenDashboard | null = null;
  presentaciones: PresentacionesResumen | null = null;
  totalesAnuales: { actual: number; anterior: number } | null = null;
  cargandoTotalesAnuales = false;
  errorTotalesAnuales = '';
  totalesMensuales: { actual: number; anterior: number } | null = null;
  cargandoTotalesMensuales = false;
  errorTotalesMensuales = '';
  readonly nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  cargando = false;
  error = '';
  readonly hoy = new Date();
  readonly mesActualIndice = new Date().getMonth();
  readonly elencos: ElencoDashboard[] = ['INFANTIL', 'PLANTA', 'MÁSTER'];
  private resumenSubscription?: Subscription;
  private totalesAnualesSubscription?: Subscription;
  private totalesMensualesSubscription?: Subscription;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly presentacionesService: PresentacionesService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  irACumpleanos(sub: 'semana' | 'mes'): void {
    void this.router.navigate(['/cumpleanos'], { queryParams: { tab: 'planificacion', sub } });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.cargarResumen();
  }

  ngOnDestroy(): void {
    this.resumenSubscription?.unsubscribe();
    this.totalesAnualesSubscription?.unsubscribe();
    this.totalesMensualesSubscription?.unsubscribe();
  }

  cargarResumen(): void {
    this.resumenSubscription?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.resumenSubscription = this.dashboardService.obtenerResumen().subscribe({
      next: resumen => {
        this.resumen = resumen;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No pudimos cargar el resumen. Revisa la conexión e inténtalo nuevamente.';
        this.cargando = false;
      }
    });
    this.dashboardService.obtenerPresentacionesPorMes(this.hoy.getFullYear()).subscribe(
      presentaciones => this.presentaciones = presentaciones
    );
    this.cargarTotalesAnuales();
    this.cargarTotalesMensuales();
  }

  cargarTotalesAnuales(): void {
    this.totalesAnualesSubscription?.unsubscribe();
    this.totalesAnuales = null;
    this.errorTotalesAnuales = '';
    this.cargandoTotalesAnuales = true;
    this.totalesAnualesSubscription = this.presentacionesService.reporteAnual(this.hoy.getFullYear()).subscribe({
      next: reporte => {
        this.totalesAnuales = reporte.meses.reduce(
          (totales, mes) => ({
            actual: totales.actual + mes.actual.cantidad_presentaciones,
            anterior: totales.anterior + mes.anterior.cantidad_presentaciones
          }),
          { actual: 0, anterior: 0 }
        );
        this.cargandoTotalesAnuales = false;
      },
      error: () => {
        this.cargandoTotalesAnuales = false;
        this.errorTotalesAnuales = 'No se pudieron cargar los totales anuales.';
      }
    });
  }

  cargarTotalesMensuales(): void {
    this.totalesMensualesSubscription?.unsubscribe();
    this.totalesMensuales = null;
    this.errorTotalesMensuales = '';
    this.cargandoTotalesMensuales = true;
    this.totalesMensualesSubscription = this.presentacionesService.reporteMensual(
      this.hoy.getFullYear(), this.hoy.getMonth() + 1
    ).subscribe({
      next: reporte => {
        this.totalesMensuales = {
          actual: reporte.actual.cantidad_presentaciones,
          anterior: reporte.anterior.cantidad_presentaciones
        };
        this.cargandoTotalesMensuales = false;
      },
      error: () => {
        this.cargandoTotalesMensuales = false;
        this.errorTotalesMensuales = 'No se pudieron cargar los totales mensuales.';
      }
    });
  }

  porcentajeElenco(elenco: ElencoDashboard, estado: 'activos' | 'inactivos'): number {
    const totalActivos = this.resumen?.bailarines.totalActivos ?? 0;
    const totalInactivos = this.resumen?.bailarines.totalInactivos ?? 0;
    const total = totalActivos + totalInactivos;
    const value = this.resumen?.bailarines.porElenco[elenco][estado] ?? 0;
    return total ? Math.max(value / total * 100, value > 0 ? 2 : 0) : 0;
  }

  saludo(): string {
    const hora = this.hoy.getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get fechaActual(): string {
    return new Intl.DateTimeFormat('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(this.hoy);
  }

  get mesActual(): string {
    return new Intl.DateTimeFormat('es-EC', { month: 'long' }).format(this.hoy);
  }

  get anioAnterior(): number {
    return this.hoy.getFullYear() - 1;
  }

}
