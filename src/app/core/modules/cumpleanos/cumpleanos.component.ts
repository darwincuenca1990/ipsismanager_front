import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  ElencoPlantilla,
  PlantillaCumpleanos,
  PlantillaCumpleanosPayload,
  PlantillasCumpleanosService
} from '../../services/plantillas-cumpleanos.service';

@Component({
  selector: 'app-cumpleanos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cumpleanos.component.html',
  styleUrl: './cumpleanos.component.css'
})
export class CumpleanosComponent implements OnInit {
  readonly opcionesElenco: { value: ElencoPlantilla; label: string }[] = [
    { value: 'INFANTIL', label: 'Infantil' },
    { value: 'PLANTA', label: 'Planta' },
    { value: 'MÁSTER', label: 'Máster' }
  ];

  plantillas: PlantillaCumpleanos[] = [];
  filtroElenco: ElencoPlantilla | '' = '';
  cargando = false;
  guardando = false;
  eliminandoId: number | null = null;
  mostrarFormulario = false;
  plantillaSeleccionada: PlantillaCumpleanos | null = null;
  error = '';

  readonly form = this.fb.nonNullable.group({
    elenco: ['INFANTIL' as ElencoPlantilla, Validators.required],
    mensaje: ['', Validators.required],
    activa: [true]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly plantillasService: PlantillasCumpleanosService
  ) {}

  ngOnInit(): void {
    this.cargarPlantillas();
  }

  cargarPlantillas(): void {
    this.cargando = true;
    this.error = '';
    this.plantillasService.listar(this.filtroElenco || undefined).subscribe({
      next: plantillas => {
        this.plantillas = plantillas;
        this.cargando = false;
      },
      error: error => {
        this.error = this.mensajeError(error, 'No se pudieron cargar las plantillas.');
        this.cargando = false;
      }
    });
  }

  cambiarFiltro(elenco: string): void {
    this.filtroElenco = elenco as ElencoPlantilla | '';
    this.cargarPlantillas();
  }

  nuevaPlantilla(): void {
    this.plantillaSeleccionada = null;
    this.form.reset({ elenco: this.filtroElenco || 'INFANTIL', mensaje: '', activa: true });
    this.mostrarFormulario = true;
    this.error = '';
  }

  editarPlantilla(plantilla: PlantillaCumpleanos): void {
    this.plantillaSeleccionada = plantilla;
    this.form.reset({
      elenco: plantilla.elenco,
      mensaje: plantilla.mensaje,
      activa: plantilla.activa
    });
    this.mostrarFormulario = true;
    this.error = '';
  }

  cerrarFormulario(): void {
    if (this.guardando) return;
    this.mostrarFormulario = false;
    this.plantillaSeleccionada = null;
  }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando) return;

    const payload: PlantillaCumpleanosPayload = this.form.getRawValue();
    const seleccionada = this.plantillaSeleccionada;
    this.guardando = true;
    this.error = '';
    const request = seleccionada
      ? this.plantillasService.actualizar(seleccionada.id, payload)
      : this.plantillasService.crear(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.plantillaSeleccionada = null;
        this.cargarPlantillas();
        void Swal.fire({
          title: seleccionada ? 'Plantilla actualizada' : 'Plantilla creada',
          text: seleccionada ? 'Los cambios se guardaron correctamente.' : 'La plantilla se creó correctamente.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      },
      error: error => {
        this.guardando = false;
        this.error = this.mensajeError(error, 'No se pudo guardar la plantilla.');
      }
    });
  }

  async eliminarPlantilla(plantilla: PlantillaCumpleanos): Promise<void> {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar plantilla?',
      text: `Se eliminará la plantilla de ${plantilla.elenco_display}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b42318'
    });
    if (!confirmacion.isConfirmed) return;

    this.eliminandoId = plantilla.id;
    this.error = '';
    this.plantillasService.eliminar(plantilla.id).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargarPlantillas();
        void Swal.fire({
          title: 'Plantilla eliminada',
          text: 'La plantilla se eliminó correctamente.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      },
      error: error => {
        this.eliminandoId = null;
        this.error = this.mensajeError(error, 'No se pudo eliminar la plantilla.');
      }
    });
  }

  etiquetaElenco(elenco: ElencoPlantilla): string {
    return this.opcionesElenco.find(opcion => opcion.value === elenco)?.label ?? elenco;
  }

  insertarNombre(textarea: HTMLTextAreaElement): void {
    const control = this.form.controls.mensaje;
    const inicio = textarea.selectionStart;
    const fin = textarea.selectionEnd;
    control.setValue(`${control.value.slice(0, inicio)}{nombre}${control.value.slice(fin)}`);
    control.markAsDirty();
    textarea.focus();
    textarea.setSelectionRange(inicio + 8, inicio + 8);
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
