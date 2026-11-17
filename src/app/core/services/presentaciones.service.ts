import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { constants } from '../../../assets/constants/constants';
import { Elenco } from './commons.service';
import { PaginaApi } from './paginas-api';

export type TipoPresentacion = 'UN ELENCO' | 'FESTIVALIPSIS';

export interface BitacoraPresentacion {
  bailarin: number;
  coreografias: number[];
}

export interface PresentacionDatos {
  fecha: string;
  lugar: string;
  hora_presentacion: string;
  persona_cargo: number;
  costo_total_presentacion: string;
  costo_transporte: string;
  nombre_transporte: string;
  tipo_presentacion: TipoPresentacion;
  elencos: Elenco[];
  bitacora: BitacoraPresentacion[];
}

export interface Presentacion extends PresentacionDatos {
  id: number;
  costo_neto: string;
}

export interface FiltrosPresentaciones {
  mes?: number;
  anio?: number;
  lugar?: string;
}

export interface ResumenReportePresentaciones {
  anio: number;
  cantidad_presentaciones: number;
  ids_presentaciones: number[];
  costo_total_presentacion: string;
  costo_transporte: string;
  costo_neto: string;
}

export interface ReporteMensualPresentaciones {
  mes: number;
  actual: ResumenReportePresentaciones;
  anterior: ResumenReportePresentaciones;
}

export interface ReporteAnualPresentaciones {
  anio: number;
  anio_anterior: number;
  meses: ReporteMensualPresentaciones[];
}

@Injectable({ providedIn: 'root' })
export class PresentacionesService {
  private readonly url = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/presentaciones/`;

  constructor(private readonly http: HttpClient) {}

  listar(filtros: FiltrosPresentaciones, enlace?: string): Observable<Presentacion[] | PaginaApi<Presentacion>> {
    const consulta = enlace?.split('?')[1]?.split('#')[0] ?? '';
    let params = new HttpParams({ fromString: consulta });
    if (!enlace) {
      if (filtros.mes) params = params.set('mes', filtros.mes);
      if (filtros.anio) params = params.set('anio', filtros.anio);
      if (filtros.lugar) params = params.set('lugar', filtros.lugar);
    }
    return this.http.get<Presentacion[] | PaginaApi<Presentacion>>(this.url, { params });
  }

  obtener(id: number): Observable<Presentacion> {
    return this.http.get<Presentacion>(`${this.url}${id}/`);
  }

  reporteMensual(anio: number, mes: number): Observable<ReporteMensualPresentaciones> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ReporteMensualPresentaciones>(`${this.url}reporte-mensual/`, { params });
  }

  reporteAnual(anio: number): Observable<ReporteAnualPresentaciones> {
    return this.http.get<ReporteAnualPresentaciones>(`${this.url}reporte-anual/`, {
      params: new HttpParams().set('anio', anio)
    });
  }

  crear(datos: PresentacionDatos): Observable<Presentacion> {
    return this.http.post<Presentacion>(this.url, datos);
  }

  actualizar(id: number, datos: PresentacionDatos): Observable<Presentacion> {
    return this.http.patch<Presentacion>(`${this.url}${id}/`, datos);
  }
}
