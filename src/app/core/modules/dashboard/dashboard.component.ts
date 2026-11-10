import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService, ElencoDashboard, PresentacionesResumen, ResumenDashboard } from '../../services/dashboard.service';

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
  readonly nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  cargando = false;
  error = '';
  readonly hoy = new Date();
  readonly mesActualIndice = new Date().getMonth();
  readonly elencos: ElencoDashboard[] = ['INFANTIL', 'PLANTA', 'MÁSTER'];
  private resumenSubscription?: Subscription;

  constructor(
    private readonly dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.cargarResumen();
  }

  ngOnDestroy(): void {
    this.resumenSubscription?.unsubscribe();
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
