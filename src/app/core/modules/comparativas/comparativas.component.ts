import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type { EChartsOption } from 'echarts';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { forkJoin, Subscription } from 'rxjs';
import { Bailarin, BailarinesService } from '../../services/bailarines.service';
import { Coreografia, CoreografiasService } from '../../services/coreografias.service';
import { Presentacion, PresentacionesService, ReporteAnualPresentaciones, ReporteMensualPresentaciones, ResumenReportePresentaciones } from '../../services/presentaciones.service';
import { GraficoComparativaComponent } from './grafico-comparativa.component';
import { cargarCatalogosPresentacion, combinarBailarines } from '../presentaciones/catalogos-presentacion';
import { DetallePresentacionComponent } from '../presentaciones/detalle-presentacion.component';

type Metrica = 'cantidad_presentaciones' | 'costo_total_presentacion' | 'costo_transporte' | 'costo_neto';
type TabReporte = 'mensual' | 'anual';

@Component({
  selector: 'app-comparativas',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, MessageModule, GraficoComparativaComponent, DetallePresentacionComponent],
  templateUrl: './comparativas.component.html',
  styleUrl: './comparativas.component.css'
})
export class ComparativasComponent implements OnInit, OnDestroy {
  private readonly hoy = new Date();
  readonly meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly opcionesMeses = this.meses.map((label, indice) => ({ label, value: indice + 1 }));
  readonly opcionesAnios = Array.from({ length: Math.max(0, this.hoy.getFullYear() + 2 - 2013) },
    (_, indice) => ({ label: String(2013 + indice), value: 2013 + indice }));
  readonly metricas: { label: string; value: Metrica }[] = [
    { label: 'Cantidad de presentaciones', value: 'cantidad_presentaciones' },
    { label: 'Costo total', value: 'costo_total_presentacion' },
    { label: 'Costo de transporte', value: 'costo_transporte' },
    { label: 'Costo neto', value: 'costo_neto' }
  ];
  tab: TabReporte = 'mensual';
  mes = this.hoy.getMonth() + 1;
  anioMensual = this.hoy.getFullYear();
  anioAnual = this.hoy.getFullYear();
  metrica: Metrica = 'cantidad_presentaciones';
  mensual: ReporteMensualPresentaciones | null = null;
  anual: ReporteAnualPresentaciones | null = null;
  cargando = false;
  error = '';
  errorGrafico = '';
  opcionesGrafico: EChartsOption | null = null;
  detalle: Presentacion | null = null;
  bailarinesDetalle: Bailarin[] = [];
  coreografiasDetalle: Coreografia[] = [];
  cargandoDetalle = false;
  errorDetalle = '';
  private idDetalle?: number;
  private solicitud?: Subscription;
  private solicitudDetalle?: Subscription;
  private suscripcionRuta?: Subscription;

  constructor(
    private readonly servicio: PresentacionesService,
    private readonly bailarinesService: BailarinesService,
    private readonly coreografiasService: CoreografiasService,
    private readonly route: ActivatedRoute,
    @Inject(PLATFORM_ID) private readonly plataforma: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.plataforma)) {
      let inicializada = false;
      this.suscripcionRuta = this.route.queryParamMap.subscribe(params => {
        const tab: TabReporte = params.get('tab') === 'anual' ? 'anual' : 'mensual';
        if (!inicializada || this.tab !== tab) {
          this.tab = tab;
          this.consultar();
        }
        inicializada = true;
      });
    }
  }

  verDetalle(id: number): void {
    this.solicitudDetalle?.unsubscribe();
    this.idDetalle = id;
    this.detalle = null;
    this.errorDetalle = '';
    this.cargandoDetalle = true;
    this.solicitudDetalle = forkJoin({
      presentacion: this.servicio.obtener(id),
      catalogos: cargarCatalogosPresentacion(this.bailarinesService, this.coreografiasService)
    }).subscribe({
      next: ({ presentacion, catalogos }) => {
        this.bailarinesDetalle = combinarBailarines(catalogos.inactivos, catalogos.activos);
        this.coreografiasDetalle = catalogos.coreografias;
        this.detalle = presentacion;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.cargandoDetalle = false;
        this.errorDetalle = 'No se pudo cargar el detalle de la presentación o sus catálogos.';
      }
    });
  }

  reintentarDetalle(): void {
    if (this.idDetalle !== undefined) this.verDetalle(this.idDetalle);
  }

  cerrarDetalle(): void {
    this.solicitudDetalle?.unsubscribe();
    this.cargandoDetalle = false;
    this.errorDetalle = '';
    this.detalle = null;
    this.idDetalle = undefined;
  }

  ngOnDestroy(): void {
    this.solicitud?.unsubscribe();
    this.solicitudDetalle?.unsubscribe();
    this.suscripcionRuta?.unsubscribe();
  }

  cambiarTab(tab: TabReporte): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.consultar();
  }

  consultar(): void {
    this.solicitud?.unsubscribe();
    this.error = '';
    this.errorGrafico = '';
    this.opcionesGrafico = null;
    this.mensual = null;
    this.anual = null;
    this.cargando = true;
    if (this.tab === 'mensual') {
      this.solicitud = this.servicio.reporteMensual(this.anioMensual, this.mes).subscribe({
        next: reporte => { this.mensual = reporte; this.cargando = false; this.actualizarGrafico(); },
        error: () => { this.cargando = false; this.error = 'No se pudo cargar el reporte mensual. Inténtalo nuevamente.'; }
      });
    } else {
      this.solicitud = this.servicio.reporteAnual(this.anioAnual).subscribe({
        next: reporte => { this.anual = reporte; this.cargando = false; this.actualizarGrafico(); },
        error: () => { this.cargando = false; this.error = 'No se pudo cargar el reporte anual. Inténtalo nuevamente.'; }
      });
    }
  }

  actualizarGrafico(): void {
    this.errorGrafico = '';
    const valor = (resumen: ResumenReportePresentaciones) => Number(resumen[this.metrica]);
    const nombre = this.metricas.find(opcion => opcion.value === this.metrica)?.label ?? this.metrica;
    if (this.tab === 'mensual' && this.mensual) {
      const { anterior, actual } = this.mensual;
      this.opcionesGrafico = {
        tooltip: { trigger: 'axis' }, grid: { left: 60, right: 25, top: 35, bottom: 45, containLabel: true },
        xAxis: { type: 'category', data: [String(anterior.anio), String(actual.anio)] },
        yAxis: { type: 'value', name: nombre },
        series: [{ name: nombre, type: 'line', data: [valor(anterior), valor(actual)], symbolSize: 9 }]
      };
    } else if (this.tab === 'anual' && this.anual) {
      const reporte = this.anual;
      const meses = [...reporte.meses].sort((a, b) => a.mes - b.mes);
      this.opcionesGrafico = {
        tooltip: { trigger: 'axis' }, legend: { data: [String(reporte.anio_anterior), String(reporte.anio)] },
        grid: { left: 50, right: 20, top: 55, bottom: 45, containLabel: true },
        xAxis: { type: 'category', data: meses.map(item => this.nombreMes(item.mes)), axisLabel: { hideOverlap: true } },
        yAxis: { type: 'value', name: nombre },
        series: [
          { name: String(reporte.anio_anterior), type: 'bar', data: meses.map(item => valor(item.anterior)) },
          { name: String(reporte.anio), type: 'bar', data: meses.map(item => valor(item.actual)) }
        ]
      };
    }
  }

  nombreMes(mes: number): string {
    return this.meses[mes - 1] ?? `Mes ${mes}`;
  }
}
