import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BailarinesService } from '../../services/bailarines.service';
import {
  CumpleaneroDetalle,
  CumpleanosPeriodo,
  PlantillasCumpleanosService,
  SemanaCumpleanos
} from '../../services/plantillas-cumpleanos.service';

@Component({
  selector: 'app-cumpleanos-planificacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cumpleanos-planificacion.component.html',
  styleUrl: './cumpleanos-planificacion.component.css'
})
export class CumpleanosPlanificacionComponent implements OnInit, OnDestroy {
  readonly nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly semanas: { value: SemanaCumpleanos; label: string }[] = [
    { value: 'anterior', label: 'Semana anterior' },
    { value: 'actual', label: 'Esta semana' },
    { value: 'siguiente', label: 'Semana siguiente' }
  ];

  subTab: 'semana' | 'mes' = 'semana';
  semana: SemanaCumpleanos = 'actual';
  mes = new Date().getMonth() + 1;
  periodo: CumpleanosPeriodo | null = null;
  cargando = false;
  error = '';
  private subscription?: Subscription;
  private paramsSubscription?: Subscription;
  private solicitudesFoto: Subscription[] = [];
  fotoUrlPorId: Record<number, string> = {};

  constructor(
    private readonly service: PlantillasCumpleanosService,
    private readonly bailarinesService: BailarinesService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.paramsSubscription = this.route.queryParamMap.subscribe(params => {
      const sub = params.get('sub') === 'mes' ? 'mes' : 'semana';
      if (sub !== this.subTab || !this.periodo) {
        this.subTab = sub;
        this.cargar();
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.subscription?.unsubscribe();
    this.limpiarFotografias();
  }

  inicial(bailarin: CumpleaneroDetalle): string {
    return (bailarin.nombres || '?').charAt(0).toUpperCase();
  }

  private cargarFotografias(bailarines: CumpleaneroDetalle[]): void {
    this.limpiarFotografias();
    bailarines
      .filter(b => !!b.fotografia)
      .forEach(b => {
        this.solicitudesFoto.push(this.bailarinesService.obtenerFotografia(b.id).subscribe({
          next: blob => {
            if (blob.size) this.fotoUrlPorId[b.id] = URL.createObjectURL(blob);
          },
          error: () => {
            // Sin imagen disponible: se mantiene la inicial como avatar.
          }
        }));
      });
  }

  private limpiarFotografias(): void {
    this.solicitudesFoto.forEach(s => s.unsubscribe());
    this.solicitudesFoto = [];
    Object.values(this.fotoUrlPorId).forEach(url => URL.revokeObjectURL(url));
    this.fotoUrlPorId = {};
  }

  seleccionarSubTab(tab: 'semana' | 'mes'): void {
    this.subTab = tab;
    this.cargar();
  }

  seleccionarSemana(semana: SemanaCumpleanos): void {
    this.semana = semana;
    this.cargar();
  }

  cargar(): void {
    this.subscription?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.periodo = null;
    const peticion = this.subTab === 'semana'
      ? this.service.listarCumpleanosSemana(this.semana)
      : this.service.listarCumpleanosMes(this.mes);

    this.subscription = peticion.subscribe({
      next: periodo => {
        this.periodo = {
          ...periodo,
          data: [...periodo.data].sort((a, b) => this.claveDia(a) - this.claveDia(b) || a.apellidos.localeCompare(b.apellidos))
        };
        this.cargando = false;
        this.cargarFotografias(this.periodo.data);
      },
      error: () => {
        this.error = 'No se pudieron cargar los cumpleaños.';
        this.cargando = false;
      }
    });
  }

  dia(bailarin: CumpleaneroDetalle): string {
    return bailarin.fecha_nacimiento.slice(8, 10);
  }

  mesCorto(bailarin: CumpleaneroDetalle): string {
    return this.nombresMeses[Number(bailarin.fecha_nacimiento.slice(5, 7)) - 1]?.slice(0, 3) ?? '';
  }

  edadQueCumple(bailarin: CumpleaneroDetalle): number {
    const referencia = this.periodo?.fecha_inicio
      ? Number(this.periodo.fecha_inicio.slice(0, 4))
      : new Date().getFullYear();
    return referencia - Number(bailarin.fecha_nacimiento.slice(0, 4));
  }

  private claveDia(bailarin: CumpleaneroDetalle): number {
    return Number(bailarin.fecha_nacimiento.slice(5, 7)) * 100 + Number(bailarin.fecha_nacimiento.slice(8, 10));
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
}
