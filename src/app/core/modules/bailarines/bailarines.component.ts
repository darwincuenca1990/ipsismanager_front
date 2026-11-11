import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Bailarin, BailarinFormValue, BailarinesService, Genero, GrupoFamiliar, Inscripcion } from '../../services/bailarines.service';
import { CommonsService, Elenco } from '../../services/commons.service';
import { obtenerTodasLasPaginas } from '../../services/paginas-api';
import { CrearBailarinesComponent } from '../crear-bailarines/crear-bailarines.component';

@Component({
  selector: 'app-bailarines',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressSpinnerModule, CrearBailarinesComponent, MessageModule, DropdownModule, PaginatorModule],
  templateUrl: './bailarines.component.html',
  styleUrl: './bailarines.component.css'
})
export class BailarinesComponent implements OnInit, OnDestroy {
  bailarines: Bailarin[] = [];
  fotoUrlPorId: Record<number, string> = {};
  busqueda = '';
  filtroElenco: Elenco | 'TODOS' = 'TODOS';
  filtroEstado: 'ACTIVO' | 'INACTIVO' = 'ACTIVO';
  filtroGenero: Genero | 'TODOS' = 'TODOS';
  primeraFila = 0;
  readonly filasPorPagina = 10;
  readonly opcionesFiltroGenero: { value: Genero | 'TODOS'; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'FEMENINO', label: 'Femenino' },
    { value: 'MASCULINO', label: 'Masculino' }
  ];
  cargando = false;
  guardando = false;
  mostrarFormulario = false;
  error = '';
  errorFormulario = '';
  bailarinSeleccionado: Bailarin | null = null;
  bailarinDetalle: Bailarin | null = null;
  vista: 'listado' | 'candidatos' = 'listado';
  candidatos: Bailarin[] = [];
  fechaLimiteCandidatos: string | null = null;
  cargandoCandidatos = false;
  errorCandidatos = '';
  readonly opcionesFiltroElenco: { value: Elenco | 'TODOS'; label: string }[];
  private solicitudesFoto: Subscription[] = [];
  private solicitudListado?: Subscription;

  constructor(
    private readonly bailarinesService: BailarinesService,
    private readonly commonsService: CommonsService,
    private readonly route: ActivatedRoute
  ) {
    this.opcionesFiltroElenco = [{ value: 'TODOS', label: 'Todos los elencos' }, ...this.commonsService.opcionesElenco];
  }

  get opcionesElenco(): { value: Elenco; label: string }[] {
    return this.commonsService.opcionesElenco;
  }

  ngOnInit(): void {
    const estado = this.route.snapshot.queryParamMap.get('estado')?.toUpperCase();
    if (estado === 'ACTIVO' || estado === 'INACTIVO') this.filtroEstado = estado;
    const elenco = this.route.snapshot.queryParamMap.get('elenco')?.toUpperCase();
    if (elenco && this.opcionesElenco.some(opcion => opcion.value === elenco)) {
      this.filtroElenco = elenco as Elenco;
    }
    this.cargarBailarines();
    if (this.route.snapshot.queryParamMap.get('vista') === 'candidatos') this.seleccionarVista('candidatos');
  }

  seleccionarVista(vista: 'listado' | 'candidatos'): void {
    this.vista = vista;
    if (vista === 'candidatos') this.cargarCandidatos();
  }

  cargarCandidatos(): void {
    this.cargandoCandidatos = true;
    this.errorCandidatos = '';
    this.bailarinesService.listarCandidatosPlanta().subscribe({
      next: respuesta => {
        this.candidatos = [...respuesta.data].sort((a, b) => (a.fecha_nacimiento ?? '').localeCompare(b.fecha_nacimiento ?? ''));
        this.fechaLimiteCandidatos = respuesta.fecha_limite;
        this.cargandoCandidatos = false;
        this.cargarFotografiasCandidatos(this.candidatos);
      },
      error: () => {
        this.errorCandidatos = 'No se pudieron cargar los candidatos al elenco de planta.';
        this.cargandoCandidatos = false;
      }
    });
  }

  edadActual(bailarin: Bailarin): number | null {
    const [y, m, d] = (bailarin.fecha_nacimiento ?? '').slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - y;
    if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--;
    return edad;
  }

  fechaCumple14(bailarin: Bailarin): string {
    const [y, m, d] = (bailarin.fecha_nacimiento ?? '').slice(0, 10).split('-');
    return y ? `${d}/${m}/${Number(y) + 14}` : '—';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '';
    const [y, m, d] = fecha.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }

  private cargarFotografiasCandidatos(bailarines: Bailarin[]): void {
    bailarines
      .filter(b => !!(b.fotografia || b.fotografia_drive_id) && !this.fotoUrlPorId[b.id])
      .forEach(b => {
        this.solicitudesFoto.push(this.bailarinesService.obtenerFotografia(b.id).subscribe({
          next: blob => {
            if (blob.size && typeof URL !== 'undefined' && URL.createObjectURL) {
              this.fotoUrlPorId[b.id] = URL.createObjectURL(blob);
            }
          },
          error: () => {
            // Se conserva el avatar genérico.
          }
        }));
      });
  }

  ngOnDestroy(): void {
    this.solicitudListado?.unsubscribe();
    this.limpiarFotografias();
  }

  get bailarinesFiltrados(): Bailarin[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.bailarines.filter(bailarin => {
      const estadoReal = this.estadoBailarin(bailarin) ?? 'ACTIVO';
      const coincideEstado = estadoReal === this.filtroEstado;
      const coincideElenco = this.filtroElenco === 'TODOS' || bailarin.elenco === this.filtroElenco;
      const coincideGenero = this.filtroGenero === 'TODOS' || bailarin.genero === this.filtroGenero;
      const coincideTexto = !texto || `${bailarin.apellidos} ${bailarin.nombres} ${bailarin.cedula}`.toLocaleLowerCase().includes(texto);
      return coincideElenco && coincideEstado && coincideGenero && coincideTexto;
    });
  }

  get bailarinesPagina(): Bailarin[] {
    return this.bailarinesFiltrados.slice(this.primeraFila, this.primeraFila + this.filasPorPagina);
  }

  cambiarPagina(evento: PaginatorState): void {
    this.primeraFila = evento.first ?? 0;
  }

  reiniciarPagina(): void {
    this.primeraFila = 0;
  }

  cargarBailarines(): void {
    this.solicitudListado?.unsubscribe();
    this.cargando = true;
    this.error = '';
    const filtros = {
      elenco: this.filtroElenco === 'TODOS' ? 'todos' : this.filtroElenco,
      estado: this.filtroEstado
    };
    this.solicitudListado = obtenerTodasLasPaginas<Bailarin>(enlace =>
      enlace ? this.bailarinesService.listar(filtros, enlace) : this.bailarinesService.listar(filtros)
    ).subscribe({
      next: bailarines => {
        this.bailarines = bailarines;
        const total = this.bailarinesFiltrados.length;
        if (this.primeraFila >= total) {
          this.primeraFila = total ? Math.floor((total - 1) / this.filasPorPagina) * this.filasPorPagina : 0;
        }
        this.cargarFotografias(this.bailarines);
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = this.mensajeError(err, 'No se pudo cargar la lista de bailarines.');
      }
    });
  }

  nuevo(): void {
    this.errorFormulario = '';
    this.bailarinSeleccionado = null;
    this.mostrarFormulario = true;
  }

  editar(bailarin: Bailarin): void {
    this.errorFormulario = '';
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
    this.errorFormulario = '';
    const bailarinSeleccionado = this.bailarinSeleccionado;
    const esActualizacion = !!bailarinSeleccionado;
    const request = bailarinSeleccionado
      ? this.bailarinesService.actualizar(bailarinSeleccionado, value)
      : this.bailarinesService.crear(value);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.cargarBailarines();
        void Swal.fire({
          title: esActualizacion ? 'Registro actualizado' : 'Registro creado correctamente',
          text: esActualizacion
            ? 'El registro se actualizó correctamente.'
            : 'El registro se creó correctamente.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      },
      error: err => {
        this.guardando = false;
        this.errorFormulario = this.mensajeError(err, 'No se pudo guardar el bailarín.');
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

  ver(bailarin: Bailarin): void {
    this.bailarinDetalle = bailarin;
  }

  cerrarDetalle(): void {
    this.bailarinDetalle = null;
  }

  get grupoFamiliarDetalle(): GrupoFamiliar | null {
    const grupo = this.bailarinDetalle?.grupo_familiar;
    return grupo && typeof grupo === 'object' ? grupo : null;
  }

  get inscripcionDetalle(): Inscripcion | null {
    const bailarin = this.bailarinDetalle;
    if (!bailarin) return null;
    if (bailarin.inscripcion) return bailarin.inscripcion;

    const relacionada = bailarin.inscripciones?.length
      ? [...bailarin.inscripciones].sort((a, b) =>
          (b.fecha_ingreso_agrupacion ?? '').localeCompare(a.fecha_ingreso_agrupacion ?? '')
        )[0]
      : null;
    const fechaIngreso = relacionada?.fecha_ingreso_agrupacion || bailarin.fecha_ingreso_agrupacion;
    if (!fechaIngreso) return null;

    return {
      fecha_ingreso_agrupacion: fechaIngreso,
      estado: relacionada?.estado ?? bailarin.estado ?? 'ACTIVO',
      motivo_ingreso_agrupacion: relacionada?.motivo_ingreso_agrupacion ?? bailarin.motivo_ingreso_agrupacion ?? '',
      fecha_salida: relacionada?.fecha_salida ?? bailarin.fecha_salida ?? null
    };
  }

  get antiguedadDetalle(): string {
    return this.commonsService.calcularAntiguedad(this.inscripcionDetalle?.fecha_ingreso_agrupacion);
  }

  fotografiaUrl(bailarin: Bailarin | null): string | null {
    return bailarin ? this.fotoUrlPorId[bailarin.id] ?? null : null;
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

  private cargarFotografias(bailarines: Bailarin[]): void {
    this.limpiarFotografias();
    bailarines
      .filter(bailarin => !!(bailarin.fotografia || bailarin.fotografia_drive_id))
      .forEach(bailarin => {
        const request = this.bailarinesService.obtenerFotografia(bailarin.id).subscribe({
          next: blob => {
            if (blob.size && typeof URL !== 'undefined' && URL.createObjectURL) {
              this.fotoUrlPorId[bailarin.id] = URL.createObjectURL(blob);
            }
          },
          error: () => {
            // Si no hay imagen o el endpoint falla, se conserva el avatar genérico.
          }
        });
        this.solicitudesFoto.push(request);
      });
  }

  private limpiarFotografias(): void {
    this.solicitudesFoto.forEach(request => request.unsubscribe());
    this.solicitudesFoto = [];
    Object.values(this.fotoUrlPorId).forEach(url => URL.revokeObjectURL(url));
    this.fotoUrlPorId = {};
  }

  cambiarFiltros(): void {
    this.reiniciarPagina();
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
