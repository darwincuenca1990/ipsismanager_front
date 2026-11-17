import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { constants } from '../../../assets/constants/constants';
import { Elenco } from './commons.service';

export interface GrupoFamiliar {
  id?: number;
  pk?: number;
  apellidos_papa: string;
  nombres_papa: string;
  celular_papa: string;
  lugar_trabajo_papa: string;
  apellidos_mama: string;
  nombres_mama: string;
  celular_mama: string;
  lugar_trabajo_mama: string;
  nombres_completos_representante: string;
  lugar_trabajo_representante: string;
  celular_representante: string;
  parentesco: string;
}

export interface Inscripcion {
  fecha_ingreso_agrupacion: string;
  estado: 'ACTIVO' | 'INACTIVO';
  motivo_ingreso_agrupacion: string;
  fecha_salida: string | null;
}

export type Genero = 'MASCULINO' | 'FEMENINO';

export interface Bailarin {
  id: number;
  pk?: number;
  grupo_familiar: number | GrupoFamiliar;
  cedula: string;
  apellidos: string;
  nombres: string;
  genero: Genero | null;
  estudia: boolean;
  institucion_estudio: string;
  trabaja: boolean;
  lugar_trabajo: string;
  direccion_domicilio: string;
  referencia_domicilio: string;
  vive_con: 'PADRES' | 'FAMILIARES' | 'OTROS' | '';
  fecha_nacimiento: string;
  elenco: Elenco;
  lugar_nacimiento: string;
  celular: string;
  padece_enfermedad: boolean;
  detalle_enfermedad: string;
  correo: string;
  fotografia?: string | null;
  fotografia_drive_id?: string | null;
  autorizado_publicacion: boolean;
  fecha_autorizacion_publicacion?: string | null;
  inscripcion?: Inscripcion;
  inscripciones?: Inscripcion[];
  fecha_ingreso_agrupacion?: string | null;
  estado?: 'ACTIVO' | 'INACTIVO' | null;
  motivo_ingreso_agrupacion?: string | null;
  fecha_salida?: string | null;
}

export interface BailarinFormValue extends Omit<Bailarin, 'id' | 'pk' | 'grupo_familiar' | 'fotografia' | 'inscripcion' | 'genero'> {
  grupo_familiar: GrupoFamiliar;
  fotografia: File | null;
  inscripcion: Inscripcion;
  genero: Genero;
}

export interface FiltrosBailarines {
  elenco: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface CandidatosPlanta {
  fecha_actual: string | null;
  fecha_limite: string | null;
  data: Bailarin[];
}

export type DetalleErrorImportacion = string | DetalleErrorImportacion[] | { [campo: string]: DetalleErrorImportacion };

export interface ResultadoImportacionBailarines {
  creados: { fila: number; id: number }[];
  errores: { fila: number; errores: DetalleErrorImportacion }[];
}

@Injectable({ providedIn: 'root' })
export class BailarinesService {
  private readonly apiUrl = constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT;

  constructor(private readonly http: HttpClient) {}

  importarExcel(archivo: File): Observable<ResultadoImportacionBailarines> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<ResultadoImportacionBailarines>(`${this.apiUrl}/bailarines/importar-excel/`, formData);
  }

  listarCandidatosPlanta(): Observable<CandidatosPlanta> {
    return this.http.get<Partial<CandidatosPlanta> | Bailarin[]>(`${this.apiUrl}/bailarines/candidatos-elenco-planta/`).pipe(
      map(response => Array.isArray(response)
        ? { fecha_actual: null, fecha_limite: null, data: response }
        : {
            fecha_actual: response?.fecha_actual ?? null,
            fecha_limite: response?.fecha_limite ?? null,
            data: response?.data ?? []
          })
    );
  }

  listar(filtros: FiltrosBailarines, enlace?: string): Observable<any> {
    const consulta = enlace?.split('?')[1]?.split('#')[0] ?? '';
    const params = new HttpParams({ fromString: consulta })
      .set('elenco', filtros.elenco)
      .set('estado', filtros.estado);
    const path = constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.BAILARINES.PATH;
    return this.http.get<any>(`${this.apiUrl}${path}`, { params });
  }

  obtenerFotografia(id: number): Observable<Blob> {
    const bailarines = constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.BAILARINES;
    const path = bailarines.PATH + bailarines.FOTOGRAFIA.replace('{id}', String(id));
    return this.http.get(`${this.apiUrl}${path}`, { responseType: 'blob' });
  }

  obtenerGrupo(id: number): Observable<GrupoFamiliar> {
    return this.http.get<GrupoFamiliar>(`${this.apiUrl}/grupos-familiares/${id}/`);
  }

  crear(value: BailarinFormValue): Observable<any> {
    return this.http.post<GrupoFamiliar>(`${this.apiUrl}/grupos-familiares/`, value.grupo_familiar).pipe(
      switchMap(grupo => this.http.post<any>(`${this.apiUrl}/bailarines/`, this.toPayload(value, this.getId(grupo)))),
      switchMap(bailarin => this.subirFotografiaSiExiste(bailarin, value.fotografia))
    );
  }

  actualizar(bailarin: Bailarin, value: BailarinFormValue): Observable<any> {
    const grupoId = this.getId(bailarin.grupo_familiar);
    const updateGrupo = grupoId
      ? this.http.patch(`${this.apiUrl}/grupos-familiares/${grupoId}/`, value.grupo_familiar)
      : this.http.post<GrupoFamiliar>(`${this.apiUrl}/grupos-familiares/`, value.grupo_familiar);

    return updateGrupo.pipe(
      switchMap(grupo => this.http.patch<any>(
        `${this.apiUrl}/bailarines/${this.getId(bailarin)}/`,
        this.toPayload(value, this.getId(grupo) || grupoId)
      )),
      switchMap(response => this.subirFotografiaSiExiste(response, value.fotografia, this.getId(bailarin)))
    );
  }

  eliminar(bailarin: Bailarin): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bailarines/${this.getId(bailarin)}/`);
  }

  private toPayload(value: BailarinFormValue, grupoId: number): Record<string, unknown> {
    const { grupo_familiar: _grupo, fotografia: _fotografia, ...fields } = value;
    const payload = {
      ...fields,
      grupo_familiar_id: grupoId,
      inscripcion: {
        ...value.inscripcion,
        fecha_salida: value.inscripcion.fecha_salida || null
      }
    };

    console.log('Inscripción que se enviará al backend:', payload.inscripcion);
    return payload;
  }

  private subirFotografiaSiExiste<T>(response: T, fotografia: File | null, fallbackId?: number): Observable<T> {
    if (!fotografia) return of(response);

    const responseRecord = response as { id?: number; pk?: number; data?: { id?: number; pk?: number } } | null;
    const id = responseRecord?.id ?? responseRecord?.pk ?? responseRecord?.data?.id ?? responseRecord?.data?.pk ?? fallbackId;
    if (!id) {
      return throwError(() => new Error('El API no devolvió el id del bailarín para subir la fotografía.'));
    }

    const formData = new FormData();
    formData.append('fotografia', fotografia, fotografia.name);
    return this.http.patch(`${this.apiUrl}/bailarines/${id}/`, formData).pipe(map(() => response));
  }

  private getId(value: number | { id?: number; pk?: number }): number {
    return typeof value === 'number' ? value : (value?.id ?? value?.pk ?? 0);
  }
}
