import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { constants } from '../../../assets/constants/constants';

export type ElencoPlantilla = 'INFANTIL' | 'PLANTA' | 'MÁSTER';
export type EstadoTarjeta = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type EstadoGeneracion = 'GENERADA' | 'NO_GENERADA';
export type PlataformaRedSocial = 'FACEBOOK' | 'INSTAGRAM';
export type EstadoPublicacion = 'PENDIENTE' | 'PUBLICADA' | 'ERROR';

export interface PlantillaCumpleanos {
  id: number;
  elenco: ElencoPlantilla;
  elenco_display: string;
  mensaje: string;
  activa: boolean;
}

export interface Bailarin {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface TarjetaCumpleanos {
  id: number;
  bailarin: Bailarin;
  bailarin_nombre?: string;
  anio: number;
  imagen?: string;
  mensaje_generado: string;
  estado_generacion: EstadoGeneracion;
  motivo_no_generacion: string;
  estado: EstadoTarjeta;
  fecha_generacion?: string;
  fecha_aprobacion?: string | null;
  aprobado_por_username?: string | null;
  observaciones: string;
}

export interface PublicacionRedSocial {
  id: number;
  plataforma: PlataformaRedSocial;
  estado: EstadoPublicacion;
  mensaje_error?: string;
  fecha_publicacion?: string;
}

export interface TarjetaConPublicaciones extends TarjetaCumpleanos {
  publicaciones: PublicacionRedSocial[];
}

export interface GenerarTarjetaPayload {
  imagen: File;
  mensaje_generado: string;
}

export interface PublicarEnRedSocialPayload {
  plataformas: PlataformaRedSocial[];
  texto_publicacion: string;
}

export type PlantillaCumpleanosPayload = Pick<PlantillaCumpleanos, 'elenco' | 'mensaje' | 'activa'>;

interface PlantillaResponse {
  data?: PlantillaCumpleanos[];
}

interface TarjetasResponse {
  data: TarjetaCumpleanos[];
}

export type SemanaCumpleanos = 'anterior' | 'actual' | 'siguiente';

export interface CumpleaneroDetalle {
  id: number;
  elenco: string;
  estado: string;
  cedula: string;
  apellidos: string;
  nombres: string;
  fecha_nacimiento: string;
  celular?: string | null;
  correo?: string | null;
  fotografia?: string | null;
  autorizado_publicacion?: boolean;
  grupo_familiar?: {
    nombres_completos_representante?: string;
    celular_representante?: string;
    parentesco?: string;
  } | null;
}

export interface CumpleanosPeriodo {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  data: CumpleaneroDetalle[];
}

type CumpleanosPeriodoResponse = Partial<CumpleanosPeriodo>;

interface TarjetaResponse {
  data: TarjetaConPublicaciones[];
}

export interface PublicacionDetalle {
  id: number;
  tarjeta: number;
  plataforma: PlataformaRedSocial;
  estado: EstadoPublicacion;
  texto_publicacion: string;
  fecha_publicacion: string | null;
  id_publicacion_externa: string;
  mensaje_error: string;
  creado_en: string;
  actualizado_en: string;
}

interface PublicacionesResponse {
  data: PublicacionDetalle[];
}

@Injectable({ providedIn: 'root' })
export class PlantillasCumpleanosService {
  private readonly apiBaseUrl = constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT;
  private readonly cumpleanosApi = constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CUMPLEANOS;
  private readonly apiUrl = this.apiBaseUrl + this.cumpleanosApi.PLANTILLAS;
  private readonly tarjetasUrl = this.apiBaseUrl + '/cumpleanos/tarjetas/';
  private readonly publicacionesUrl = this.apiBaseUrl + '/cumpleanos/publicaciones/';

  constructor(private readonly http: HttpClient) {}

  listar(elenco?: ElencoPlantilla): Observable<PlantillaCumpleanos[]> {
    const params = elenco ? new HttpParams().set('elenco', elenco) : new HttpParams();
    return this.http.get<PlantillaResponse | PlantillaCumpleanos[]>(this.apiUrl, { params }).pipe(
      map(response => Array.isArray(response) ? response : response.data ?? [])
    );
  }

  crear(payload: PlantillaCumpleanosPayload): Observable<PlantillaCumpleanos> {
    return this.http.post<PlantillaResponse | PlantillaCumpleanos>(this.apiUrl, payload).pipe(
      map(response => this.obtenerRegistro(response))
    );
  }

  actualizar(id: number, payload: PlantillaCumpleanosPayload): Observable<PlantillaCumpleanos> {
    return this.http.patch<PlantillaResponse | PlantillaCumpleanos>(`${this.apiUrl}${id}/`, payload).pipe(
      map(response => this.obtenerRegistro(response))
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  ejecutarDetector(): Observable<unknown> {
    return this.http.post<unknown>(this.apiBaseUrl + this.cumpleanosApi.DETECTOR, {});
  }

  resolverUrlTarjeta(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    if (typeof window === 'undefined') return url;

    const apiOrigin = new URL(this.apiBaseUrl, window.location.origin);
    return new URL(url, apiOrigin).toString();
  }

  descargarTarjeta(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  // ===== Métodos para administración de tarjetas =====

  listarTarjetas(
    anio?: number,
    estadoGeneracion?: EstadoGeneracion,
    estado?: EstadoTarjeta
  ): Observable<TarjetaCumpleanos[]> {
    let params = new HttpParams();

    const yearActual = anio || new Date().getFullYear();
    params = params.set('anio', yearActual.toString());

    if (estadoGeneracion) {
      params = params.set('estado_generacion', estadoGeneracion);
    }

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<TarjetasResponse>(this.tarjetasUrl, { params }).pipe(
      map(response => response.data ?? [])
    );
  }

  listarTarjetasNoGeneradas(): Observable<TarjetaCumpleanos[]> {
    const anioActual = new Date().getFullYear();
    return this.listarTarjetas(anioActual, 'NO_GENERADA');
  }

  listarTarjetasListasParaPublicar(): Observable<TarjetaCumpleanos[]> {
    const anioActual = new Date().getFullYear();
    return this.listarTarjetas(anioActual, 'GENERADA', 'PENDIENTE');
  }

  listarTarjetasPublicadas(): Observable<TarjetaCumpleanos[]> {
    return this.listarTarjetas(new Date().getFullYear(), undefined, 'APROBADA');
  }

  listarPublicaciones(
    estado: 'PUBLICADA' | 'ERROR',
    anio: number,
    meses: string[]
  ): Observable<PublicacionDetalle[]> {
    if (meses.length === 0) return of([]);
    const peticiones = meses.map(mes => {
      const params = new HttpParams()
        .set('estado', estado)
        .set('anio', anio.toString())
        .set('mes_desde', mes)
        .set('mes_hasta', mes);
      return this.http.get<PublicacionesResponse>(this.publicacionesUrl, { params }).pipe(
        map(response => response.data ?? [])
      );
    });
    return forkJoin(peticiones).pipe(
      map(resultados => resultados.flat().sort((a, b) =>
        (b.fecha_publicacion ?? b.creado_en).localeCompare(a.fecha_publicacion ?? a.creado_en)
      ))
    );
  }

  obtenerTarjeta(id: number): Observable<TarjetaConPublicaciones> {
    return this.http.get<TarjetaResponse>(`${this.tarjetasUrl}${id}/`).pipe(
      map(response => response.data?.[0] as TarjetaConPublicaciones)
    );
  }

  generarTarjetaManualmente(
    id: number,
    payload: GenerarTarjetaPayload
  ): Observable<TarjetaConPublicaciones> {
    const formData = new FormData();
    formData.append('imagen', payload.imagen);
    formData.append('mensaje_generado', payload.mensaje_generado);

    return this.http.post<TarjetaResponse>(
      `${this.tarjetasUrl}${id}/generar-manual/`,
      formData
    ).pipe(
      map(response => response.data?.[0] as TarjetaConPublicaciones)
    );
  }

  publicarEnRedesSociales(
    id: number,
    payload: PublicarEnRedSocialPayload
  ): Observable<TarjetaConPublicaciones> {
    return this.http.post<TarjetaResponse>(
      `${this.tarjetasUrl}${id}/publicar-redes-sociales/`,
      payload
    ).pipe(
      map(response => response.data?.[0] as TarjetaConPublicaciones)
    );
  }

  aprobarTarjeta(id: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.tarjetasUrl}${id}/aprobar/`, {});
  }

  listarCumpleanosSemana(semana: SemanaCumpleanos): Observable<CumpleanosPeriodo> {
    let params = new HttpParams();
    if (semana !== 'actual') params = params.set('semana', semana);
    return this.http.get<CumpleanosPeriodoResponse>(this.apiBaseUrl + '/bailarines/cumpleanos-semana/', { params }).pipe(
      map(response => this.normalizarPeriodo(response))
    );
  }

  listarCumpleanosMes(mes: number): Observable<CumpleanosPeriodo> {
    const params = new HttpParams().set('mes', mes.toString());
    return this.http.get<CumpleanosPeriodoResponse>(this.apiBaseUrl + '/bailarines/cumpleanos-mes/', { params }).pipe(
      map(response => this.normalizarPeriodo(response))
    );
  }

  private normalizarPeriodo(response: CumpleanosPeriodoResponse | CumpleaneroDetalle[]): CumpleanosPeriodo {
    if (Array.isArray(response)) return { fecha_inicio: null, fecha_fin: null, data: response };
    return {
      fecha_inicio: response?.fecha_inicio ?? null,
      fecha_fin: response?.fecha_fin ?? null,
      data: response?.data ?? []
    };
  }

  private obtenerRegistro(response: PlantillaResponse | PlantillaCumpleanos): PlantillaCumpleanos {
    if ('data' in response) {
      const plantilla = response.data?.[0];
      if (plantilla) return plantilla;
    }
    return response as PlantillaCumpleanos;
  }
}
