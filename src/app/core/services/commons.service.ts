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

  /** Calcula la antigüedad transcurrida desde una fecha sin guardar el resultado. */
  calcularAntiguedad(fechaInicio?: string | null, fechaReferencia: Date = new Date()): string {
    if (!fechaInicio) return 'Selecciona la fecha de ingreso';

    const [year, month, day] = fechaInicio.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return 'Fecha de ingreso no válida';

    const inicio = new Date(Date.UTC(year, month - 1, day));
    const hoy = new Date(Date.UTC(
      fechaReferencia.getFullYear(),
      fechaReferencia.getMonth(),
      fechaReferencia.getDate()
    ));
    if (
      inicio.getUTCFullYear() !== year ||
      inicio.getUTCMonth() !== month - 1 ||
      inicio.getUTCDate() !== day
    ) {
      return 'Fecha de ingreso no válida';
    }
    if (inicio > hoy) return 'La fecha de ingreso es futura';

    const addMonths = (date: Date, amount: number): Date => {
      const targetMonth = date.getUTCMonth() + amount;
      const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
      return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(date.getUTCDate(), lastDay)));
    };

    let totalMonths = (hoy.getUTCFullYear() - year) * 12 + hoy.getUTCMonth() - (month - 1);
    if (addMonths(inicio, totalMonths) > hoy) totalMonths--;

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const anchor = addMonths(inicio, totalMonths);
    const days = Math.floor((hoy.getTime() - anchor.getTime()) / 86_400_000);
    const parts: string[] = [];

    if (years) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    if (months) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
    if (days || parts.length === 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);

    return parts.join(', ');
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
