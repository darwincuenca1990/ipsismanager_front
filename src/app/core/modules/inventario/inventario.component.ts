import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  AdquisicionTraje, ComposicionTraje, DatosInventario, InventarioService,
  PrendaTraje, RecursoInventario, TipoTraje
} from '../../services/inventario.service';

type Registro = TipoTraje | PrendaTraje | ComposicionTraje | AdquisicionTraje;

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit, OnDestroy {
  readonly secciones: { clave: RecursoInventario; nombre: string; singular: string }[] = [
    { clave: 'tipos', nombre: 'Tipos de traje', singular: 'tipo de traje' },
    { clave: 'prendas', nombre: 'Prendas', singular: 'prenda' },
    { clave: 'composiciones', nombre: 'Composiciones', singular: 'composición' },
    { clave: 'adquisiciones', nombre: 'Adquisiciones', singular: 'adquisición' }
  ];
  seccion: RecursoInventario = 'tipos';
  tipos: TipoTraje[] = [];
  prendas: PrendaTraje[] = [];
  composiciones: ComposicionTraje[] = [];
  adquisiciones: AdquisicionTraje[] = [];
  cargando = false;
  guardando = false;
  operando = false;
  errorListado = '';
  errorFormulario = '';
  mostrarFormulario = false;
  editandoId: number | null = null;
  archivo: File | null = null;
  private carga?: Subscription;
  private operacion?: Subscription;
  private destruido = false;

  readonly form = this.fb.group({
    nombre: ['', [Validators.maxLength(150)]],
    variante: ['', [Validators.maxLength(100)]],
    region_cultura: ['', [Validators.maxLength(150)]],
    nombre_prenda: ['', [Validators.maxLength(150)]],
    descripcion: [''],
    observaciones: [''],
    estado: ['ACTIVO'],
    tipo_traje: [null as number | null],
    prenda: [null as number | null],
    cantidad_requerida: [null as number | null],
    precio_unitario: [''],
    fecha_adquisicion: [''],
    cantidad_adquirida: [null as number | null],
    costo_unitario: [''],
    proveedor: ['', [Validators.maxLength(200)]]
  });

  constructor(private readonly fb: FormBuilder, private readonly servicio: InventarioService) {}

  ngOnInit(): void { this.cargar(); }

  ngOnDestroy(): void {
    this.destruido = true;
    this.carga?.unsubscribe();
    this.operacion?.unsubscribe();
  }

  cargar(): void {
    this.carga?.unsubscribe();
    this.cargando = true;
    this.errorListado = '';
    this.carga = forkJoin({
      tipos: this.servicio.listar('tipos'),
      prendas: this.servicio.listar('prendas'),
      composiciones: this.servicio.listar('composiciones'),
      adquisiciones: this.servicio.listar('adquisiciones')
    }).subscribe({
      next: datos => {
        this.tipos = datos.tipos;
        this.prendas = datos.prendas;
        this.composiciones = datos.composiciones;
        this.adquisiciones = datos.adquisiciones;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.errorListado = this.mensajeError(error, 'No se pudo cargar el inventario.');
      }
    });
  }

  get nombreSeccion(): string {
    return this.secciones.find(item => item.clave === this.seccion)?.singular ?? '';
  }

  nombreTipo(id: number): string {
    const tipo = this.tipos.find(item => item.id === id);
    return tipo ? `${tipo.nombre} - ${tipo.variante}` : `Traje #${id}`;
  }

  nombrePrenda(composicion: ComposicionTraje): string {
    return composicion.prenda_detalle?.nombre_prenda
      ?? this.prendas.find(item => item.id === composicion.prenda)?.nombre_prenda
      ?? `Prenda #${composicion.prenda}`;
  }

  abrir(registro?: Registro): void {
    this.editandoId = registro?.id ?? null;
    this.archivo = null;
    this.errorFormulario = '';
    this.form.reset({ estado: 'ACTIVO' });
    if (registro) this.form.patchValue(registro);
    this.mostrarFormulario = true;
  }

  seleccionarArchivo(evento: Event): void {
    this.archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
  }

  cerrar(): void {
    if (!this.guardando) this.mostrarFormulario = false;
  }

  guardar(): void {
    if (this.guardando) return;
    const datos = this.datosFormulario();
    if (!datos) return;
    const campoArchivo = this.seccion === 'tipos' ? 'fotografia_referencia'
      : this.seccion === 'prendas' ? 'fotografia'
      : this.seccion === 'adquisiciones' ? 'comprobante' : '';
    this.guardando = true;
    this.errorFormulario = '';
    this.operacion = this.servicio.guardar(this.seccion, this.editandoId, datos,
      this.archivo && campoArchivo ? { campo: campoArchivo, valor: this.archivo } : undefined
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.cargar();
      },
      error: error => {
        this.guardando = false;
        this.errorFormulario = this.mensajeError(error, 'No se pudo guardar el registro.');
      }
    });
  }

  async eliminar(registro: PrendaTraje | ComposicionTraje): Promise<void> {
    if (this.operando || (this.seccion !== 'prendas' && this.seccion !== 'composiciones')) return;
    const recurso = this.seccion;
    const confirmacion = await Swal.fire({
      title: '¿Eliminar registro?', text: 'Esta acción no se puede deshacer.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed || this.destruido || this.operando) return;
    this.operando = true;
    this.errorListado = '';
    this.operacion = this.servicio.eliminar(recurso, registro.id).subscribe({
      next: () => { this.operando = false; this.cargar(); },
      error: error => { this.operando = false; this.errorListado = this.mensajeError(error, 'No se pudo eliminar el registro.'); }
    });
  }

  async inactivar(tipo: TipoTraje): Promise<void> {
    if (this.operando) return;
    const confirmacion = await Swal.fire({
      title: '¿Inactivar tipo de traje?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Inactivar', cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed || this.destruido || this.operando) return;
    this.operando = true;
    this.errorListado = '';
    this.operacion = this.servicio.inactivarTipo(tipo.id).subscribe({
      next: () => { this.operando = false; this.cargar(); },
      error: error => { this.operando = false; this.errorListado = this.mensajeError(error, 'No se pudo inactivar el traje.'); }
    });
  }

  private datosFormulario(): DatosInventario | null {
    const v = this.form.getRawValue();
    const requerido = (valor: string | null) => !!valor?.trim();
    const cantidadValida = (valor: number | null) => valor !== null && Number.isSafeInteger(valor) && valor >= 1;
    const dineroValido = (valor: string | null) => typeof valor === 'string' && /^\d{1,10}(\.\d{1,2})?$/.test(valor.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorFormulario = 'Revisa la longitud de los campos.';
      return null;
    }
    if (this.seccion === 'tipos') {
      if (!requerido(v.nombre) || !requerido(v.variante) || !requerido(v.region_cultura)) {
        this.errorFormulario = 'Nombre, variante y región o cultura son obligatorios.';
        return null;
      }
      return { nombre: v.nombre!.trim(), variante: v.variante!.trim(), region_cultura: v.region_cultura!.trim(),
        descripcion: v.descripcion ?? '', estado: v.estado ?? 'ACTIVO' };
    }
    if (this.seccion === 'prendas') {
      if (!requerido(v.nombre_prenda)) {
        this.errorFormulario = 'El nombre de la prenda es obligatorio.';
        return null;
      }
      return { nombre_prenda: v.nombre_prenda!.trim(), descripcion: v.descripcion ?? '',
        observaciones: v.observaciones ?? '', estado: v.estado ?? 'ACTIVO' };
    }
    if (!v.tipo_traje) {
      this.errorFormulario = 'Selecciona un tipo de traje.';
      return null;
    }
    if (this.seccion === 'composiciones') {
      if (!v.prenda || !cantidadValida(v.cantidad_requerida) || (v.precio_unitario && !dineroValido(v.precio_unitario))) {
        this.errorFormulario = 'Selecciona una prenda, una cantidad entera positiva y un precio válido no negativo.';
        return null;
      }
      return { tipo_traje: v.tipo_traje, prenda: v.prenda, cantidad_requerida: v.cantidad_requerida,
        precio_unitario: v.precio_unitario?.trim() || null, observaciones: v.observaciones ?? '', estado: v.estado ?? 'ACTIVO' };
    }
    if (!v.fecha_adquisicion || !cantidadValida(v.cantidad_adquirida) || !dineroValido(v.costo_unitario)) {
      this.errorFormulario = 'Indica la fecha, una cantidad entera positiva y un costo unitario válido no negativo.';
      return null;
    }
    return { tipo_traje: v.tipo_traje, fecha_adquisicion: v.fecha_adquisicion, cantidad_adquirida: v.cantidad_adquirida,
      costo_unitario: v.costo_unitario!.trim(), proveedor: v.proveedor ?? '', observaciones: v.observaciones ?? '' };
  }

  private mensajeError(error: HttpErrorResponse, alternativa: string): string {
    const detalle: unknown = error.error;
    const desglosar = (valor: unknown, campo = ''): string[] => {
      if (typeof valor === 'string') return [campo ? `${campo}: ${valor}` : valor];
      if (Array.isArray(valor)) return valor.flatMap(item => desglosar(item, campo));
      if (valor && typeof valor === 'object') return Object.entries(valor).flatMap(([clave, item]) =>
        desglosar(item, campo ? `${campo}.${clave}` : clave));
      return [];
    };
    return desglosar(detalle).join(' · ') || alternativa;
  }
}
