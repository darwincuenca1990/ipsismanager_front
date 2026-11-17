import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Coreografia, CoreografiaDatos, CoreografiasService } from '../../services/coreografias.service';

function urlVideoValida(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname && !/\s/.test(value);
  } catch {
    return false;
  }
}

function textoRequerido(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

function validarUrlVideo(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && urlVideoValida(control.value.trim()) ? null : { url: true };
}

@Component({
  selector: 'app-coreografias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coreografias.component.html',
  styleUrl: './coreografias.component.css'
})
export class CoreografiasComponent implements OnInit {
  coreografias: Coreografia[] = [];
  total = 0;
  siguiente: string | null = null;
  anterior: string | null = null;
  enlaceActual: string | undefined;
  enlaceSolicitado: string | undefined;
  cargando = false;
  guardando = false;
  eliminando = false;
  mostrarFormulario = false;
  enviado = false;
  errorListado = '';
  errorFormulario = '';
  seleccionada: Coreografia | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [textoRequerido, Validators.maxLength(150)]],
    region: ['', [textoRequerido, Validators.maxLength(150)]],
    descripcion: ['', textoRequerido],
    url_video: ['', [textoRequerido, validarUrlVideo, Validators.maxLength(500)]]
  });

  constructor(private readonly fb: FormBuilder, private readonly service: CoreografiasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(enlace?: string): void {
    this.enlaceSolicitado = enlace;
    this.cargando = true;
    this.errorListado = '';
    this.service.listar(enlace).subscribe({
      next: respuesta => {
        this.enlaceActual = enlace;
        if (Array.isArray(respuesta)) {
          this.coreografias = respuesta;
          this.total = respuesta.length;
          this.siguiente = null;
          this.anterior = null;
        } else {
          this.coreografias = respuesta.results;
          this.total = respuesta.count;
          this.siguiente = respuesta.next;
          this.anterior = respuesta.previous;
        }
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.errorListado = this.mensajeError(error, 'No se pudieron cargar las coreografías.');
      }
    });
  }

  nuevo(): void {
    this.seleccionada = null;
    this.form.reset();
    this.enviado = false;
    this.errorFormulario = '';
    this.mostrarFormulario = true;
  }

  editar(coreografia: Coreografia): void {
    this.seleccionada = coreografia;
    this.form.reset({
      nombre: coreografia.nombre,
      region: coreografia.region,
      descripcion: coreografia.descripcion,
      url_video: coreografia.url_video
    });
    this.enviado = false;
    this.errorFormulario = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (!this.guardando) this.mostrarFormulario = false;
  }

  guardar(): void {
    this.enviado = true;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando) return;

    const valores = this.form.getRawValue();
    const datos: CoreografiaDatos = {
      nombre: valores.nombre.trim(),
      region: valores.region.trim(),
      descripcion: valores.descripcion.trim(),
      url_video: valores.url_video.trim()
    };
    const esEdicion = !!this.seleccionada;
    const solicitud = this.seleccionada
      ? this.service.actualizar(this.seleccionada.id, datos)
      : this.service.crear(datos);
    this.guardando = true;
    this.errorFormulario = '';
    solicitud.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.cargar(esEdicion ? this.enlaceActual : undefined);
        void Swal.fire('Guardado', 'La coreografía se guardó correctamente.', 'success');
      },
      error: error => {
        this.guardando = false;
        this.errorFormulario = this.mensajeError(error, 'No se pudo guardar la coreografía.');
      }
    });
  }

  async eliminar(coreografia: Coreografia): Promise<void> {
    if (this.eliminando) return;
    const confirmacion = await Swal.fire({
      title: '¿Eliminar coreografía?',
      text: `Se eliminará "${coreografia.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b42318'
    });
    if (!confirmacion.isConfirmed || this.eliminando) return;

    this.eliminando = true;
    this.errorListado = '';
    this.service.eliminar(coreografia.id).subscribe({
      next: () => {
        this.eliminando = false;
        this.cargar(this.coreografias.length === 1 && this.anterior ? this.anterior : this.enlaceActual);
      },
      error: error => {
        this.eliminando = false;
        this.errorListado = this.mensajeError(error, 'No se pudo eliminar la coreografía.');
      }
    });
  }

  tieneVideoValido(url: string): boolean {
    return urlVideoValida(url);
  }

  private mensajeError(error: HttpErrorResponse, fallback: string): string {
    const detalle: unknown = error.error;
    if (typeof detalle === 'string' && detalle.trim()) return detalle;
    if (detalle && typeof detalle === 'object') {
      const mensajes = Object.entries(detalle)
        .map(([campo, valor]) => `${campo}: ${Array.isArray(valor) ? valor.join(', ') : String(valor)}`)
        .join(' · ');
      if (mensajes) return mensajes;
    }
    return fallback;
  }
}
