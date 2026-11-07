import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
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

export interface Bailarin {
  id: number;
  pk?: number;
  grupo_familiar: number | GrupoFamiliar;
  cedula: string;
  apellidos: string;
  nombres: string;
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
  autorizado_publicacion: boolean;
  fecha_autorizacion_publicacion?: string | null;
  inscripcion?: Inscripcion;
}

export interface BailarinFormValue extends Omit<Bailarin, 'id' | 'pk' | 'grupo_familiar' | 'fotografia' | 'inscripcion'> {
  grupo_familiar: GrupoFamiliar;
  fotografia: File | null;
  inscripcion: Inscripcion;
}

export interface FiltrosBailarines {
  elenco: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

@Injectable({ providedIn: 'root' })
export class BailarinesService {
  private readonly apiUrl = constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT;

  constructor(private readonly http: HttpClient) {}

  listar(filtros: FiltrosBailarines): Observable<any> {
    const params = new HttpParams()
      .set('elenco', filtros.elenco)
      .set('estado', filtros.estado);
    return this.http.get<any>(`${this.apiUrl}/bailarines/`, { params });
  }

  obtenerGrupo(id: number): Observable<GrupoFamiliar> {
    return this.http.get<GrupoFamiliar>(`${this.apiUrl}/grupos-familiares/${id}/`);
  }

  crear(value: BailarinFormValue): Observable<any> {
    return this.http.post<GrupoFamiliar>(`${this.apiUrl}/grupos-familiares/`, value.grupo_familiar).pipe(
      switchMap(grupo => this.http.post(`${this.apiUrl}/bailarines/`, this.toPayload(value, this.getId(grupo))))
    );
  }

  actualizar(bailarin: Bailarin, value: BailarinFormValue): Observable<any> {
    const grupoId = this.getId(bailarin.grupo_familiar);
    const updateGrupo = grupoId
      ? this.http.patch(`${this.apiUrl}/grupos-familiares/${grupoId}/`, value.grupo_familiar)
      : this.http.post<GrupoFamiliar>(`${this.apiUrl}/grupos-familiares/`, value.grupo_familiar);

    return updateGrupo.pipe(
      switchMap(grupo => this.http.patch(
        `${this.apiUrl}/bailarines/${this.getId(bailarin)}/`,
        this.toPayload(value, this.getId(grupo) || grupoId)
      ))
    );
  }

  eliminar(bailarin: Bailarin): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bailarines/${this.getId(bailarin)}/`);
  }

  private toPayload(value: BailarinFormValue, grupoId: number): FormData | Record<string, unknown> {
    const { grupo_familiar: _grupo, fotografia, ...fields } = value;
    const payload = {
      ...fields,
      grupo_familiar_id: grupoId,
      inscripcion: {
        ...value.inscripcion,
        fecha_salida: value.inscripcion.fecha_salida || null
      }
    };

    if (!fotografia) return payload;

    const formData = new FormData();
    Object.entries(payload).forEach(([key, fieldValue]) => {
      if (key === 'inscripcion') {
        formData.append(key, JSON.stringify(fieldValue));
      } else if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        formData.append(key, String(fieldValue));
      }
    });
    formData.append('fotografia', fotografia, fotografia.name);
    return formData;
  }

  private getId(value: number | { id?: number; pk?: number }): number {
    return typeof value === 'number' ? value : (value?.id ?? value?.pk ?? 0);
  }
}

