import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { constants } from '../../../assets/constants/constants';

export type EstadoInventario = 'ACTIVO' | 'INACTIVO';
export type RecursoInventario = 'tipos' | 'prendas' | 'composiciones' | 'adquisiciones';

export interface TipoTraje {
  id: number;
  nombre: string;
  variante: string;
  region_cultura: string;
  descripcion: string;
  fotografia_referencia: string | null;
  estado: EstadoInventario;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface PrendaTraje {
  id: number;
  nombre_prenda: string;
  descripcion: string;
  fotografia: string | null;
  observaciones: string;
  estado: EstadoInventario;
}

export interface ComposicionTraje {
  id: number;
  tipo_traje: number;
  prenda: number;
  prenda_detalle: PrendaTraje;
  cantidad_requerida: number;
  precio_unitario: string | null;
  observaciones: string;
  estado: EstadoInventario;
}

export interface AdquisicionTraje {
  id: number;
  tipo_traje: number;
  fecha_adquisicion: string;
  cantidad_adquirida: number;
  costo_unitario: string;
  costo_total: string;
  proveedor: string;
  observaciones: string;
  comprobante: string | null;
  fecha_registro: string;
}

export interface InventarioRecursos {
  tipos: TipoTraje;
  prendas: PrendaTraje;
  composiciones: ComposicionTraje;
  adquisiciones: AdquisicionTraje;
}

export type DatosInventario = Record<string, string | number | null>;

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly url = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/trajes/`;

  constructor(private readonly http: HttpClient) {}

  listar<K extends RecursoInventario>(recurso: K): Observable<InventarioRecursos[K][]> {
    return this.http.get<InventarioRecursos[K][]>(`${this.url}${recurso}/`);
  }

  guardar<K extends RecursoInventario>(
    recurso: K, id: number | null, datos: DatosInventario, archivo?: { campo: string; valor: File }
  ): Observable<InventarioRecursos[K]> {
    let cuerpo: DatosInventario | FormData = datos;
    if (archivo) {
      const formulario = new FormData();
      Object.entries(datos).forEach(([campo, valor]) => {
        formulario.append(campo, valor === null ? '' : String(valor));
      });
      formulario.append(archivo.campo, archivo.valor, archivo.valor.name);
      cuerpo = formulario;
    }
    return id === null
      ? this.http.post<InventarioRecursos[K]>(`${this.url}${recurso}/`, cuerpo)
      : this.http.patch<InventarioRecursos[K]>(`${this.url}${recurso}/${id}/`, cuerpo);
  }

  inactivarTipo(id: number): Observable<TipoTraje> {
    return this.http.post<TipoTraje>(`${this.url}tipos/${id}/inactivar/`, {});
  }

  eliminar(recurso: 'prendas' | 'composiciones', id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${recurso}/${id}/`);
  }
}
