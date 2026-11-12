import { EMPTY, Observable, expand, reduce, throwError } from 'rxjs';

export interface PaginaApi<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  count: number;
}

export function obtenerTodasLasPaginas<T>(
  cargar: (enlace?: string) => Observable<T[] | PaginaApi<T>>
): Observable<T[]> {
  const visitadas = new Set<string>();
  return cargar().pipe(
    expand(respuesta => {
      if (Array.isArray(respuesta)) return EMPTY;
      if (!Array.isArray(respuesta.results) || (respuesta.next !== null && typeof respuesta.next !== 'string')) {
        return throwError(() => new Error('La respuesta paginada del servidor no es válida.'));
      }
      if (!respuesta.next) return EMPTY;
      const consulta = respuesta.next.split('?')[1]?.split('#')[0];
      if (!consulta || visitadas.has(consulta)) {
        return throwError(() => new Error('La paginación del servidor no es válida.'));
      }
      visitadas.add(consulta);
      return cargar(respuesta.next);
    }),
    reduce((todos, respuesta) => todos.concat(Array.isArray(respuesta) ? respuesta : respuesta.results), [] as T[])
  );
}
