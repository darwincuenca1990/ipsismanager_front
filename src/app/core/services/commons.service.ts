import { Injectable } from '@angular/core';

export type Elenco =
  | 'INFANTIL'
  | 'PLANTA'
  | 'MÁSTER'
  | 'ASPIRANTE INFANTIL'
  | 'ASPIRANTE PLANTA'
  | 'ASPIRANTE MÁSTER';

@Injectable({
  providedIn: 'root'
})
export class CommonsService {

   meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  readonly opcionesElenco: { value: Elenco; label: string }[] = [
    { value: 'INFANTIL', label: 'Infantil' },
    { value: 'PLANTA', label: 'Planta' },
    { value: 'MÁSTER', label: 'Máster' },
    { value: 'ASPIRANTE INFANTIL', label: 'Aspirante Infantil' },
    { value: 'ASPIRANTE PLANTA', label: 'Aspirante Planta' },
    { value: 'ASPIRANTE MÁSTER', label: 'Aspirante Máster' }
  ];

  constructor() { }

  /**formatear fecha a dd/mm/yyyy */
  formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  /**Porcentaje de variacion */
  getPorcentajeVariacion(valorAnterior: number, valorActual: number): number {
    if (valorAnterior === 0) {
      return valorActual === 0 ? 0 : 100;
    }
    const variacion = ((valorActual - valorAnterior) / valorAnterior) * 100;
    return variacion;
  }

  /**Obtener el acrónimo del mes */
getAcronimoMes(etiquetas: string[]): string[] {
  return etiquetas.map(e => {
    const [mes, _] = e.split('/'); // "01/2025" -> "01"
    const indexMes = parseInt(mes, 10) - 1;
    return this.meses[indexMes] ?? mes;
  });
  }
}
