import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Bailarin, BailarinFormValue, BailarinesService } from '../../services/bailarines.service';
import { CommonsService, Elenco } from '../../services/commons.service';
import { CrearBailarinesComponent } from '../crear-bailarines/crear-bailarines.component';

@Component({
  selector: 'app-bailarines',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearBailarinesComponent],
  templateUrl: './bailarines.component.html',
  styleUrl: './bailarines.component.css'
})
export class BailarinesComponent implements OnInit {
  bailarines: Bailarin[] = [];
  busqueda = '';
  filtroElenco: Elenco | 'TODOS' = 'TODOS';
  filtroEstado: 'ACTIVO' | 'INACTIVO' = 'ACTIVO';
  cargando = false;
  guardando = false;
  mostrarFormulario = false;
  error = '';
  bailarinSeleccionado: Bailarin | null = null;

  constructor(
    private readonly bailarinesService: BailarinesService,
    private readonly commonsService: CommonsService
  ) {}

  get opcionesElenco(): { value: Elenco; label: string }[] {
    return this.commonsService.opcionesElenco;
  }

  ngOnInit(): void {
    this.cargarBailarines();
  }

  get bailarinesFiltrados(): Bailarin[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.bailarines.filter(bailarin => {
      const estadoReal = this.estadoBailarin(bailarin) ?? 'ACTIVO';
      const coincideEstado = estadoReal === this.filtroEstado;
      const coincideElenco = this.filtroElenco === 'TODOS' || bailarin.elenco === this.filtroElenco;
      const coincideTexto = !texto || `${bailarin.apellidos} ${bailarin.nombres} ${bailarin.cedula}`.toLocaleLowerCase().includes(texto);
      return coincideElenco && coincideEstado && coincideTexto;
    });
  }

  cargarBailarines(): void {
    this.cargando = true;
    this.error = '';
    this.bailarinesService.listar({
      elenco: this.filtroElenco === 'TODOS' ? 'todos' : this.filtroElenco,
      estado: this.filtroEstado
    }).subscribe({
      next: response => {
        const rows = Array.isArray(response) ? response : response?.results;
        this.bailarines = Array.isArray(rows) ? rows : [];
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = this.mensajeError(err, 'No se pudo cargar la lista de bailarines.');
      }
    });
  }

  nuevo(): void {
    this.bailarinSeleccionado = null;
    this.mostrarFormulario = true;
  }

  editar(bailarin: Bailarin): void {
    const grupo = bailarin.grupo_familiar;
    const groupId = typeof grupo === 'number' ? grupo : (grupo.id ?? grupo.pk ?? 0);
    const groupIsComplete = typeof grupo === 'object' && !!grupo.nombres_completos_representante;

    if (groupIsComplete) {
      this.bailarinSeleccionado = bailarin;
      this.mostrarFormulario = true;
      return;
    }

    if (!groupId) {
      this.error = 'No se encontró el grupo familiar de este bailarín.';
      return;
    }

    this.cargando = true;
    this.bailarinesService.obtenerGrupo(groupId).subscribe({
      next: grupoFamiliar => {
        this.bailarinSeleccionado = { ...bailarin, grupo_familiar: grupoFamiliar };
        this.mostrarFormulario = true;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = this.mensajeError(err, 'No se pudieron cargar los datos del grupo familiar.');
      }
    });
  }

  guardar(value: BailarinFormValue): void {
    this.guardando = true;
    this.error = '';
    const request = this.bailarinSeleccionado
      ? this.bailarinesService.actualizar(this.bailarinSeleccionado, value)
      : this.bailarinesService.crear(value);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.cargarBailarines();
      },
      error: err => {
        this.guardando = false;
        this.error = this.mensajeError(err, 'No se pudo guardar el bailarín.');
      }
    });
  }

  async eliminar(bailarin: Bailarin): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar bailarín?',
      text: `Se eliminará el registro de ${bailarin.nombres} ${bailarin.apellidos}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b42318'
    });
    if (!result.isConfirmed) return;

    this.bailarinesService.eliminar(bailarin).subscribe({
      next: () => this.cargarBailarines(),
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo eliminar. Puede tener inscripciones relacionadas.');
      }
    });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.bailarinSeleccionado = null;
  }

  nombreRepresentante(bailarin: Bailarin): string {
    return typeof bailarin.grupo_familiar === 'object'
      ? bailarin.grupo_familiar.nombres_completos_representante || '—'
      : '—';
  }

  etiquetaElenco(elenco: Elenco): string {
    return this.opcionesElenco.find(opcion => opcion.value === elenco)?.label ?? elenco ?? '—';
  }

  estadoBailarin(bailarin: Bailarin): 'ACTIVO' | 'INACTIVO' | null {
    const inscripciones = (bailarin as Bailarin & {
      estado?: string;
      inscripcion?: { estado?: string };
      inscripciones?: Array<{ estado?: string; fecha_ingreso_agrupacion?: string }>;
    }).inscripciones;

    const inscripcion = (bailarin as Bailarin & { inscripcion?: { estado?: string } }).inscripcion;
    if (inscripcion?.estado) {
      return this.normalizarEstado(inscripcion.estado);
    }

    if (inscripciones?.length) {
      const inscripcionReciente = [...inscripciones].sort((a, b) =>
        (b.fecha_ingreso_agrupacion ?? '').localeCompare(a.fecha_ingreso_agrupacion ?? '')
      )[0];
      const estado = this.normalizarEstado(inscripcionReciente.estado);
      if (estado) return estado;
    }

    const estadoDirecto = this.normalizarEstado((bailarin as Bailarin & { estado?: string }).estado);
    return estadoDirecto ?? 'ACTIVO';
  }

  private normalizarEstado(estado?: string): 'ACTIVO' | 'INACTIVO' | null {
    const valor = estado?.trim().toUpperCase();
    return valor === 'ACTIVO' || valor === 'INACTIVO' ? valor : null;
  }

  cambiarFiltros(): void {
    this.cargarBailarines();
  }

  private mensajeError(error: any, fallback: string): string {
    const detail = error?.error;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      return Object.entries(detail)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join(' · ') || fallback;
    }
    return fallback;
  }

}
