import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Bailarin, BailarinesService } from './bailarines.service';

export type ElencoDashboard = 'INFANTIL' | 'PLANTA' | 'MÁSTER';

export interface CumpleaneroDashboard {
  id: number;
  nombre: string;
  elenco: string;
  fechaNacimiento: string;
  cumpleanos: string;
}

export interface ResumenDashboard {
  bailarines: {
    totalActivos: number;
    totalInactivos: number;
    porElenco: Record<ElencoDashboard, { activos: number; inactivos: number }>;
  };
  cumpleanosMes: CumpleaneroDashboard[];
  cumpleanosSemana: CumpleaneroDashboard[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private readonly bailarinesService: BailarinesService) { }

  obtenerResumen(fechaReferencia: Date = new Date()): Observable<ResumenDashboard> {
    return forkJoin({
      activos: this.bailarinesService.listar({ elenco: 'todos', estado: 'ACTIVO' }),
      inactivos: this.bailarinesService.listar({ elenco: 'todos', estado: 'INACTIVO' })
    }).pipe(
      map(({ activos, inactivos }) => {
        const bailarinesActivos = this.extraerBailarines(activos);
        const bailarinesInactivos = this.extraerBailarines(inactivos);
        const porElenco: ResumenDashboard['bailarines']['porElenco'] = {
          INFANTIL: { activos: 0, inactivos: 0 },
          PLANTA: { activos: 0, inactivos: 0 },
          'MÁSTER': { activos: 0, inactivos: 0 }
        };

        bailarinesActivos.forEach(bailarin => {
          const elenco = this.clasificarElenco(bailarin.elenco);
          if (elenco) porElenco[elenco].activos++;
        });
        bailarinesInactivos.forEach(bailarin => {
          const elenco = this.clasificarElenco(bailarin.elenco);
          if (elenco) porElenco[elenco].inactivos++;
        });

        const todos = [...bailarinesActivos, ...bailarinesInactivos];
        return {
          bailarines: {
            totalActivos: bailarinesActivos.length,
            totalInactivos: bailarinesInactivos.length,
            porElenco
          },
          cumpleanosMes: this.cumpleanerosEnPeriodo(todos, fechaReferencia, 'MES'),
          cumpleanosSemana: this.cumpleanerosEnPeriodo(todos, fechaReferencia, 'SEMANA')
        };
      })
    );
  }

  private extraerBailarines(response: unknown): Bailarin[] {
    if (Array.isArray(response)) return response as Bailarin[];
    const results = (response as { results?: unknown } | null)?.results;
    return Array.isArray(results) ? results as Bailarin[] : [];
  }

  private clasificarElenco(elenco?: string): ElencoDashboard | null {
    const normalized = (elenco ?? '').trim().toLocaleUpperCase();
    if (normalized.includes('INFANTIL')) return 'INFANTIL';
    if (normalized.includes('PLANTA')) return 'PLANTA';
    if (normalized.includes('MÁSTER') || normalized.includes('MASTER')) return 'MÁSTER';
    return null;
  }

  private cumpleanerosEnPeriodo(
    bailarines: Bailarin[],
    referencia: Date,
    periodo: 'MES' | 'SEMANA'
  ): CumpleaneroDashboard[] {
    const today = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
    const weekStart = new Date(today);
    const mondayOffset = (today.getDay() + 6) % 7;
    weekStart.setDate(today.getDate() - mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return bailarines.flatMap(bailarin => {
      const [year, month, day] = (bailarin.fecha_nacimiento ?? '').slice(0, 10).split('-').map(Number);
      if (!year || !month || !day) return [];

      const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
      if (birthdayThisYear.getMonth() !== month - 1 || birthdayThisYear.getDate() !== day) return [];

      const isInPeriod = periodo === 'MES'
        ? month === today.getMonth() + 1
        : birthdayThisYear >= weekStart && birthdayThisYear <= weekEnd;
      if (!isInPeriod) return [];

      return [{
        id: bailarin.id,
        nombre: `${bailarin.nombres} ${bailarin.apellidos}`.trim(),
        elenco: bailarin.elenco ?? '',
        fechaNacimiento: bailarin.fecha_nacimiento,
        cumpleanos: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
      }];
    }).sort((a, b) => {
      const [dayA, monthA] = a.cumpleanos.split('/').map(Number);
      const [dayB, monthB] = b.cumpleanos.split('/').map(Number);
      return monthA - monthB || dayA - dayB || a.nombre.localeCompare(b.nombre);
    });
  }
}
