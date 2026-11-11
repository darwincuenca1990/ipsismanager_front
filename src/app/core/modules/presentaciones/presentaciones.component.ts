import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { forkJoin, Subscription } from 'rxjs';
import { Bailarin, BailarinesService } from '../../services/bailarines.service';
import { CommonsService, Elenco } from '../../services/commons.service';
import { Coreografia, CoreografiasService } from '../../services/coreografias.service';
import { obtenerTodasLasPaginas } from '../../services/paginas-api';
import { Presentacion, PresentacionDatos, PresentacionesService, TipoPresentacion } from '../../services/presentaciones.service';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';

function textoRequerido(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

@Component({
  selector: 'app-presentaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DropdownModule, MultiSelectModule, PaginatorModule, SHARED_IMPORTS],
  templateUrl: './presentaciones.component.html',
  styleUrl: './presentaciones.component.css'
})
export class PresentacionesComponent implements OnInit, OnDestroy {
  presentaciones: Presentacion[] = [];
  bailarines: Bailarin[] = [];
  coreografias: Coreografia[] = [];
  activos = new Set<number>();
  elencos: Elenco[] = [];
  coreografiasSeleccionadas = new Set<number>();
  idsCoreografiasSeleccionadas: number[] = [];
  asignaciones = new Map<number, Set<number>>();
  seleccionada: Presentacion | null = null;
  detalle: Presentacion | null = null;
  mostrandoFormulario = false;
  cargando = false;
  cargandoCatalogos = false;
  guardando = false;
  enviado = false;
  errorListado = '';
  errorCatalogos = '';
  errorFormulario = '';
  mensajeExito = '';
  busquedaBailarin = '';
  private readonly hoy = new Date();
  readonly opcionesMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ].map((label, indice) => ({ label, value: indice + 1 }));
  readonly opcionesAnios = Array.from({ length: Math.max(0, this.hoy.getFullYear() + 2 - 2013) },
    (_, indice) => ({ label: String(2013 + indice), value: 2013 + indice }));
  filtros = { meses: [this.hoy.getMonth() + 1], anios: [this.hoy.getFullYear()], lugar: '' };
  filtrosAplicados = { meses: [...this.filtros.meses], anios: [...this.filtros.anios], lugar: '' };
  primeraFila = 0;
  readonly filasPorPagina = 10;
  private solicitudListado?: Subscription;
  readonly opcionesElenco = this.commons.opcionesElenco.filter(opcion =>
    opcion.value === 'INFANTIL' || opcion.value === 'PLANTA' || opcion.value === 'MÁSTER'
  );
  readonly opcionesTipoPresentacion: { label: string; value: TipoPresentacion }[] = [
    { label: 'Un elenco', value: 'UN ELENCO' },
    { label: 'Festival Ipsis', value: 'FESTIVALIPSIS' }
  ];
  opcionesPersonaCargo: { label: string; value: string }[] = [];
  readonly form = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    lugar: ['', [textoRequerido, Validators.maxLength(250)]],
    hora_presentacion: ['', Validators.required],
    persona_cargo: ['', Validators.required],
    costo_total_presentacion: ['', [Validators.required, Validators.pattern(/^\d{1,10}(\.\d{1,2})?$/)]],
    costo_transporte: ['', [Validators.required, Validators.pattern(/^\d{1,10}(\.\d{1,2})?$/)]],
    nombre_transporte: ['', [textoRequerido, Validators.maxLength(200)]],
    tipo_presentacion: this.fb.nonNullable.control<TipoPresentacion>('UN ELENCO')
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly commons: CommonsService,
    private readonly service: PresentacionesService,
    private readonly bailarinesService: BailarinesService,
    private readonly coreografiasService: CoreografiasService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.solicitudListado?.unsubscribe();
  }

  get presentacionesFiltradas(): Presentacion[] {
    const { meses, anios } = this.filtrosAplicados;
    return this.presentaciones.filter(presentacion => {
      const [anio, mes] = presentacion.fecha.split('-').map(Number);
      return (!meses.length || meses.includes(mes)) && (!anios.length || anios.includes(anio));
    });
  }

  get presentacionesPagina(): Presentacion[] {
    return this.presentacionesFiltradas.slice(this.primeraFila, this.primeraFila + this.filasPorPagina);
  }

  cambiarPagina(evento: PaginatorState): void {
    this.primeraFila = evento.first ?? 0;
  }

  cargar(): void {
    this.solicitudListado?.unsubscribe();
    this.cargando = true;
    this.errorListado = '';
    const filtros = { lugar: this.filtrosAplicados.lugar || undefined };
    this.solicitudListado = obtenerTodasLasPaginas<Presentacion>(enlace =>
      this.service.listar(filtros, enlace)
    ).subscribe({
      next: presentaciones => {
        this.presentaciones = presentaciones;
        const total = this.presentacionesFiltradas.length;
        if (this.primeraFila >= total) {
          this.primeraFila = total ? Math.floor((total - 1) / this.filasPorPagina) * this.filasPorPagina : 0;
        }
        this.cargando = false;
      },
      error: error => {
        this.presentaciones = [];
        this.primeraFila = 0;
        this.cargando = false;
        this.errorListado = this.mensajeError(error, 'No se pudieron cargar las presentaciones.');
      }
    });
  }

  aplicarFiltros(): void {
    this.filtrosAplicados = {
      meses: [...this.filtros.meses], anios: [...this.filtros.anios], lugar: this.filtros.lugar.trim()
    };
    this.primeraFila = 0;
    this.cargar();
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos = true;
    this.errorCatalogos = '';
    const cargarBailarines = (estado: 'ACTIVO' | 'INACTIVO') =>
      obtenerTodasLasPaginas<Bailarin>(enlace =>
        this.bailarinesService.listar({ elenco: 'todos', estado }, enlace)
      );
    forkJoin({
      activos: cargarBailarines('ACTIVO'),
      inactivos: cargarBailarines('INACTIVO'),
      coreografias: obtenerTodasLasPaginas<Coreografia>(enlace => this.coreografiasService.listar(enlace))
    }).subscribe({
      next: catalogos => {
        this.activos = new Set(catalogos.activos.map(b => b.id));
        this.bailarines = [...new Map([...catalogos.inactivos, ...catalogos.activos].map(b => [b.id, b])).values()];
        this.coreografias = catalogos.coreografias;
        this.actualizarOpcionesPersonaCargo();
        this.cargandoCatalogos = false;
      },
      error: error => {
        this.cargandoCatalogos = false;
        this.errorCatalogos = this.mensajeError(error, 'No se pudieron cargar los bailarines o las coreografías.');
      }
    });
  }

  get personasCargo(): Bailarin[] {
    return this.bailarines.filter(b =>
      (this.activos.has(b.id) && (b.elenco === 'PLANTA' || b.elenco === 'MÁSTER')) ||
      b.id === this.seleccionada?.persona_cargo
    ).sort((a, b) => this.compararNombre(a, b));
  }

  get bailarinesVisibles(): Bailarin[] {
    return this.bailarines.filter(b =>
      (this.activos.has(b.id) && this.elencos.includes(b.elenco)) || this.asignaciones.has(b.id)
    ).sort((a, b) => {
      const orden = (bailarin: Bailarin) => bailarin.genero === 'FEMENINO' ? 0 : bailarin.genero === 'MASCULINO' ? 1 : 2;
      return orden(a) - orden(b) || this.compararNombre(a, b);
    });
  }

  get bailarinesFiltrados(): Bailarin[] {
    const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
    const busqueda = normalizar(this.busquedaBailarin.trim());
    if (!busqueda) return this.bailarinesVisibles;
    return this.bailarinesVisibles.filter(bailarin =>
      normalizar(`${bailarin.apellidos} ${bailarin.nombres}`).includes(busqueda) ||
      normalizar(`${bailarin.nombres} ${bailarin.apellidos}`).includes(busqueda) ||
      (bailarin.cedula ?? '').includes(busqueda)
    );
  }

  get gruposBailarines(): { elenco: string; bailarines: Bailarin[] }[] {
    const bailarines = this.bailarinesFiltrados;
    if (this.form.controls.tipo_presentacion.value !== 'FESTIVALIPSIS') {
      return bailarines.length ? [{ elenco: '', bailarines }] : [];
    }
    return this.agruparPorElenco(bailarines, bailarin => bailarin.elenco)
      .map(grupo => ({ elenco: grupo.elenco, bailarines: grupo.elementos }));
  }

  identificarGrupo(_indice: number, grupo: { elenco: string }): string {
    return grupo.elenco;
  }

  get coreografiasVisibles(): Coreografia[] {
    return this.coreografias.filter(c => this.coreografiasSeleccionadas.has(c.id));
  }

  get coreografiasDetalle(): { id: number; nombre: string }[] {
    if (!this.detalle) return [];
    const ids = [...new Set(this.detalle.bitacora.flatMap(item => item.coreografias))];
    return ids.map(id => ({
      id,
      nombre: this.coreografias.find(coreografia => coreografia.id === id)?.nombre ?? `Coreografía #${id}`
    })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  get bitacoraDetalle(): Presentacion['bitacora'] {
    if (!this.detalle) return [];
    const ordenGenero = (id: number) => {
      const genero = this.bailarines.find(bailarin => bailarin.id === id)?.genero;
      return genero === 'FEMENINO' ? 0 : genero === 'MASCULINO' ? 1 : 2;
    };
    return [...this.detalle.bitacora].sort((a, b) =>
      ordenGenero(a.bailarin) - ordenGenero(b.bailarin) ||
      this.nombreBailarin(a.bailarin).localeCompare(this.nombreBailarin(b.bailarin), 'es')
    );
  }

  get agruparDetallePorElenco(): boolean {
    return this.detalle?.tipo_presentacion === 'FESTIVALIPSIS' && this.detalle.elencos.length > 1;
  }

  get gruposBitacoraDetalle(): { elenco: string; elementos: Presentacion['bitacora'] }[] {
    const registros = this.bitacoraDetalle;
    if (!this.agruparDetallePorElenco) return registros.length ? [{ elenco: '', elementos: registros }] : [];
    return this.agruparPorElenco(registros, registro => this.bailarinDetalle(registro.bailarin)?.elenco);
  }

  get costoNeto(): string {
    const total = this.form.controls.costo_total_presentacion;
    const transporte = this.form.controls.costo_transporte;
    if (total.invalid || transporte.invalid) return '—';
    const centavos = (valor: string) => {
      const [entero, decimal = ''] = valor.split('.');
      return Number(entero) * 100 + Number(decimal.padEnd(2, '0'));
    };
    return ((centavos(total.value) - centavos(transporte.value)) / 100).toFixed(2);
  }

  nuevo(): void {
    this.mensajeExito = '';
    this.busquedaBailarin = '';
    this.seleccionada = null;
    this.actualizarOpcionesPersonaCargo();
    this.form.reset({ tipo_presentacion: 'UN ELENCO' });
    this.elencos = [];
    this.coreografiasSeleccionadas.clear();
    this.idsCoreografiasSeleccionadas = [];
    this.asignaciones.clear();
    this.enviado = false;
    this.errorFormulario = '';
    this.mostrandoFormulario = true;
  }

  ver(id: number): void {
    this.cargando = true;
    this.errorListado = '';
    this.service.obtener(id).subscribe({
      next: presentacion => {
        this.detalle = presentacion;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.errorListado = this.mensajeError(error, 'No se pudo cargar el detalle de la presentación.');
      }
    });
  }

  editar(id: number): void {
    this.mensajeExito = '';
    this.cargando = true;
    this.errorListado = '';
    this.service.obtener(id).subscribe({
      next: presentacion => {
        this.seleccionada = presentacion;
        this.busquedaBailarin = '';
        this.actualizarOpcionesPersonaCargo();
        this.form.reset({
          fecha: presentacion.fecha,
          lugar: presentacion.lugar,
          hora_presentacion: presentacion.hora_presentacion,
          persona_cargo: String(presentacion.persona_cargo),
          costo_total_presentacion: String(presentacion.costo_total_presentacion),
          costo_transporte: String(presentacion.costo_transporte),
          nombre_transporte: presentacion.nombre_transporte,
          tipo_presentacion: presentacion.tipo_presentacion
        });
        this.elencos = [...presentacion.elencos];
        this.asignaciones = new Map(presentacion.bitacora.map(item => [item.bailarin, new Set(item.coreografias)]));
        this.coreografiasSeleccionadas = new Set(presentacion.bitacora.flatMap(item => item.coreografias));
        this.idsCoreografiasSeleccionadas = [...this.coreografiasSeleccionadas];
        this.enviado = false;
        this.errorFormulario = '';
        this.mostrandoFormulario = true;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.errorListado = this.mensajeError(error, 'No se pudo cargar la presentación.');
      }
    });
  }

  cambiarTipo(): void {
    if (this.form.controls.tipo_presentacion.value === 'UN ELENCO' && this.elencos.length > 1) {
      this.elencos = [];
    }
  }

  private actualizarOpcionesPersonaCargo(): void {
    this.opcionesPersonaCargo = this.personasCargo.map(persona => ({
      value: String(persona.id),
      label: `${persona.apellidos} ${persona.nombres} · ${persona.elenco}${this.activos.has(persona.id) ? '' : ' (inactivo)'}`
    }));
  }

  seleccionarUnElenco(valor: string): void {
    const opcion = this.opcionesElenco.find(item => item.value === valor);
    this.elencos = opcion ? [opcion.value] : [];
  }

  seleccionarElenco(elenco: Elenco, seleccionado: boolean): void {
    this.elencos = seleccionado ? [...this.elencos, elenco] : this.elencos.filter(item => item !== elenco);
  }

  actualizarCoreografias(ids: number[] | null): void {
    const seleccionadas = new Set(ids ?? []);
    this.coreografiasSeleccionadas.forEach(id => {
      if (!seleccionadas.has(id)) this.seleccionarCoreografia(id, false);
    });
    seleccionadas.forEach(id => this.seleccionarCoreografia(id, true));
  }

  seleccionarCoreografia(id: number, seleccionado: boolean): void {
    if (this.coreografiasSeleccionadas.has(id) === seleccionado) return;
    if (seleccionado) this.coreografiasSeleccionadas.add(id);
    else {
      this.coreografiasSeleccionadas.delete(id);
      this.asignaciones.forEach(coreografias => coreografias.delete(id));
    }
    this.idsCoreografiasSeleccionadas = [...this.coreografiasSeleccionadas];
  }

  seleccionarBailarin(id: number, seleccionado: boolean): void {
    if (seleccionado) this.asignaciones.set(id, new Set());
    else this.asignaciones.delete(id);
  }

  asignarCoreografia(bailarin: number, coreografia: number, seleccionado: boolean): void {
    const asignadas = this.asignaciones.get(bailarin);
    if (!asignadas) return;
    if (seleccionado) asignadas.add(coreografia);
    else asignadas.delete(coreografia);
  }

  get hayAsignacionesFueraDelElenco(): boolean {
    return [...this.asignaciones.keys()].some(id => {
      const bailarin = this.bailarines.find(b => b.id === id);
      return !bailarin || !this.elencos.includes(bailarin.elenco);
    });
  }

  guardar(): void {
    if (this.guardando) return;
    this.enviado = true;
    this.errorFormulario = '';
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (!this.elencos.length || (this.form.controls.tipo_presentacion.value === 'UN ELENCO' && this.elencos.length !== 1)) {
      this.errorFormulario = 'Seleccione el elenco o los elencos de la presentación.';
      return;
    }
    if (this.hayAsignacionesFueraDelElenco) {
      this.errorFormulario = 'Quite los bailarines seleccionados que no pertenecen a los elencos elegidos.';
      return;
    }
    if ([...this.coreografiasSeleccionadas].some(id => !this.coreografias.some(coreografia => coreografia.id === id))) {
      this.errorFormulario = 'No se encontraron todas las coreografías de esta presentación. Recargue los catálogos antes de guardar.';
      return;
    }
    if ([...this.coreografiasSeleccionadas].some(id => ![...this.asignaciones.values()].some(asignadas => asignadas.has(id)))) {
      this.errorFormulario = 'Cada coreografía seleccionada debe estar asignada a al menos un bailarín para poder guardarla.';
      return;
    }
    const persona = Number(this.form.controls.persona_cargo.value);
    if (!this.personasCargo.some(b => b.id === persona)) {
      this.errorFormulario = 'Seleccione una persona a cargo válida.';
      return;
    }
    const datos = this.form.getRawValue();
    const payload: PresentacionDatos = {
      ...datos,
      lugar: datos.lugar.trim(),
      nombre_transporte: datos.nombre_transporte.trim(),
      persona_cargo: persona,
      elencos: [...this.elencos],
      bitacora: [...this.asignaciones].map(([bailarin, coreografias]) => ({
        bailarin, coreografias: [...coreografias]
      }))
    };
    this.guardando = true;
    const solicitud = this.seleccionada
      ? this.service.actualizar(this.seleccionada.id, payload)
      : this.service.crear(payload);
    solicitud.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrandoFormulario = false;
        this.mensajeExito = this.seleccionada ? 'Presentación actualizada correctamente.' : 'Presentación creada correctamente.';
        this.cargar();
      },
      error: error => {
        this.guardando = false;
        this.errorFormulario = this.mensajeError(error, 'No se pudo guardar la presentación.');
      }
    });
  }

  nombreBailarin(id: number): string {
    const bailarin = this.bailarines.find(item => item.id === id);
    return bailarin ? `${bailarin.apellidos} ${bailarin.nombres}` : `Bailarín #${id}`;
  }

  bailarinDetalle(id: number): Bailarin | undefined {
    return this.bailarines.find(bailarin => bailarin.id === id);
  }

  private agruparPorElenco<T>(elementos: T[], obtenerElenco: (elemento: T) => string | null | undefined): { elenco: string; elementos: T[] }[] {
    const grupos = new Map<string, T[]>();
    for (const elemento of elementos) {
      const elenco = obtenerElenco(elemento) || 'SIN ELENCO';
      const grupo = grupos.get(elenco) ?? [];
      grupo.push(elemento);
      grupos.set(elenco, grupo);
    }
    const orden: string[] = this.commons.opcionesElenco.map(opcion => opcion.value);
    return [...grupos].map(([elenco, grupo]) => ({ elenco, elementos: grupo })).sort((a, b) => {
      const indiceA = orden.indexOf(a.elenco);
      const indiceB = orden.indexOf(b.elenco);
      return (indiceA < 0 ? orden.length : indiceA) - (indiceB < 0 ? orden.length : indiceB) ||
        a.elenco.localeCompare(b.elenco, 'es');
    });
  }

  private compararNombre(a: Bailarin, b: Bailarin): number {
    return `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, 'es');
  }

  private mensajeError(error: HttpErrorResponse | Error, fallback: string): string {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) return error.message || fallback;
    const detalle: unknown = (error as HttpErrorResponse).error;
    if (typeof detalle === 'string' && detalle.trim()) return detalle;
    if (detalle && typeof detalle === 'object') {
      return Object.entries(detalle).map(([campo, valor]) =>
        `${campo}: ${typeof valor === 'object' && !Array.isArray(valor) ? JSON.stringify(valor) : String(valor)}`
      ).join(' · ') || fallback;
    }
    return fallback;
  }
}
