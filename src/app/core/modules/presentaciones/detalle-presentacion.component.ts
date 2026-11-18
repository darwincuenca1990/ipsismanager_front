import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Bailarin, OpcionElenco } from '../../services/bailarines.service';
import { Coreografia } from '../../services/coreografias.service';
import { Presentacion } from '../../services/presentaciones.service';
import { agruparPorElenco } from './agrupar-por-elenco';

@Component({
  selector: 'app-detalle-presentacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-presentacion.component.html',
  styleUrl: './detalle-presentacion.component.css'
})
export class DetallePresentacionComponent {
  @Input({ required: true }) presentacion!: Presentacion;
  @Input({ required: true }) bailarines: Bailarin[] = [];
  @Input({ required: true }) coreografias: Coreografia[] = [];
  @Input({ required: true }) opcionesElenco: OpcionElenco[] = [];
  @Output() cerrar = new EventEmitter<void>();

  get coreografiasDetalle(): { id: number; nombre: string }[] {
    const ids = [...new Set(this.presentacion.bitacora.flatMap(item => item.coreografias))];
    return ids.map(id => ({
      id, nombre: this.coreografias.find(coreografia => coreografia.id === id)?.nombre ?? `Coreografía #${id}`
    })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  get agruparDetallePorElenco(): boolean {
    return this.presentacion.tipo_presentacion === 'FESTIVALIPSIS' && this.presentacion.elencos.length > 1;
  }

  get gruposBitacoraDetalle(): { elenco: string; elementos: Presentacion['bitacora'] }[] {
    const ordenGenero = (id: number) => {
      const genero = this.bailarinDetalle(id)?.genero;
      return genero === 'FEMENINO' ? 0 : genero === 'MASCULINO' ? 1 : 2;
    };
    const registros = [...this.presentacion.bitacora].sort((a, b) =>
      ordenGenero(a.bailarin) - ordenGenero(b.bailarin) ||
      this.nombreBailarin(a.bailarin).localeCompare(this.nombreBailarin(b.bailarin), 'es')
    );
    if (!this.agruparDetallePorElenco) return registros.length ? [{ elenco: '', elementos: registros }] : [];
    return agruparPorElenco(registros, registro => this.bailarinDetalle(registro.bailarin)?.elenco,
      this.opcionesElenco.map(opcion => opcion.value));
  }

  identificarGrupo(_indice: number, grupo: { elenco: string }): string {
    return grupo.elenco;
  }

  bailarinDetalle(id: number): Bailarin | undefined {
    return this.bailarines.find(bailarin => bailarin.id === id);
  }

  nombreBailarin(id: number): string {
    const bailarin = this.bailarinDetalle(id);
    return bailarin ? `${bailarin.apellidos} ${bailarin.nombres}` : `Bailarín #${id}`;
  }
}
