import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { constants } from '../../../assets/constants/constants';

export interface CoreografiaDatos {
  nombre: string;
  region: string;
  descripcion: string;
  url_video: string;
}

export interface Coreografia extends CoreografiaDatos {
  id: number;
}

export interface PaginaCoreografias {
  count: number;
  next: string | null;
  previous: string | null;
  results: Coreografia[];
}

@Injectable({ providedIn: 'root' })
export class CoreografiasService {
  private readonly url = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/coreografias/`;

  constructor(private readonly http: HttpClient) {}

  listar(enlace?: string): Observable<Coreografia[] | PaginaCoreografias> {
    const query = enlace?.split('?')[1]?.split('#')[0] ?? '';
    return this.http.get<Coreografia[] | PaginaCoreografias>(this.url, {
      params: new HttpParams({ fromString: query })
    });
  }

  crear(datos: CoreografiaDatos): Observable<Coreografia> {
    return this.http.post<Coreografia>(this.url, datos);
  }

  actualizar(id: number, datos: CoreografiaDatos): Observable<Coreografia> {
    return this.http.patch<Coreografia>(`${this.url}${id}/`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }
}
