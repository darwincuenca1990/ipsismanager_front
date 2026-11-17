import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  EstadoGeneracion,
  PlataformaRedSocial,
  TarjetaCumpleanos,
  TarjetaConPublicaciones,
  PlantillasCumpleanosService,
  PublicacionDetalle
} from '../../services/plantillas-cumpleanos.service';

interface TarjetaAdmin extends TarjetaCumpleanos {
  publicaciones?: any[];
  cargandoGeneracion?: boolean;
  cargandoPublicacion?: boolean;
}

interface ResultadoDetector {
  fecha: string;
  generadas: any[];
  omitidas: Array<{
    bailarin_id: number;
    bailarin: string;
    tarjeta_id: number;
    mensaje: string;
    motivos: string[];
  }>;
  ya_existentes: Array<{
    bailarin_id: number;
    bailarin: string;
    tarjeta_id: number;
    imagen: string;
    mensaje: string;
  }>;
}

@Component({
  selector: 'app-cumpleanos-administrador',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cumpleanos-administrador.component.html',
  styleUrl: './cumpleanos-administrador.component.css'
})
export class CumpleanosAdministradorComponent implements OnInit, OnDestroy {
  tarjetasNoGeneradas: TarjetaAdmin[] = [];
  tarjetasAprobadas: TarjetaAdmin[] = [];
  tarjetasPublicadas: TarjetaAdmin[] = [];
  tabActiva: 'gestion' | 'publicados' = 'gestion';
  cargandoPublicadas = false;

  subTab: 'aprobadas' | 'PUBLICADA' | 'ERROR' = 'aprobadas';
  readonly meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  readonly anios: number[] = Array.from(
    { length: new Date().getFullYear() - 2013 + 1 },
    (_, i) => new Date().getFullYear() - i
  );
  anioFiltro = new Date().getFullYear();
  mesesSeleccionados: string[] = [this.meses[new Date().getMonth()]];
  mesesAbierto = false;
  publicaciones: PublicacionDetalle[] = [];
  cargandoPublicaciones = false;
  cargando = false;
  error = '';
  mostrarFormularioGeneracion = false;
  tarjetaSeleccionada: TarjetaAdmin | null = null;
  imagenSeleccionada: File | null = null;
  probandoDetector = false;
  detectorEjecutado = false;
  resultadoDetector: ResultadoDetector | null = null;
  errorFormulario = '';
  private solicitudDetector?: Subscription;
  private solicitudNoGeneradas?: Subscription;
  private solicitudAprobadas?: Subscription;
  private solicitudPublicadas?: Subscription;

  readonly plataformas: { value: PlataformaRedSocial; label: string }[] = [
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'INSTAGRAM', label: 'Instagram' }
  ];

  readonly formGeneracion = this.fb.nonNullable.group({
    imagen: [null as File | null, Validators.required],
    mensaje_generado: ['', Validators.required]
  });

  readonly formPublicacion = this.fb.nonNullable.group({
    plataformas: [[] as PlataformaRedSocial[], Validators.required],
    texto_publicacion: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly cumpleanosService: PlantillasCumpleanosService
  ) {}

  ngOnInit(): void {
    this.cargarTarjetas();
  }

  ngOnDestroy(): void {
    this.solicitudDetector?.unsubscribe();
    this.solicitudNoGeneradas?.unsubscribe();
    this.solicitudAprobadas?.unsubscribe();
    this.solicitudPublicadas?.unsubscribe();
  }

  cargarTarjetas(): void {
    this.solicitudNoGeneradas?.unsubscribe();
    this.solicitudAprobadas?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.cargarTarjetasPublicadas();

    // Cargar tarjetas no generadas
    this.solicitudNoGeneradas = this.cumpleanosService.listarTarjetasNoGeneradas().subscribe({
      next: tarjetas => {
        this.tarjetasNoGeneradas = tarjetas.map(t => ({ 
          ...t, 
          cargandoGeneracion: false, 
          cargandoPublicacion: false 
        }));
      },
      error: error => {
        this.error = this.mensajeError(error, 'No se pudieron cargar las tarjetas no generadas.');
        this.cargando = false;
      },
      complete: () => this.cargarTarjetasListasParaPublicar()
    });
  }

  seleccionarSubTab(tab: 'aprobadas' | 'PUBLICADA' | 'ERROR'): void {
    this.subTab = tab;
    this.mesesAbierto = false;
    if (tab !== 'aprobadas') this.cargarPublicaciones();
  }

  toggleMes(mes: string): void {
    this.mesesSeleccionados = this.mesesSeleccionados.includes(mes)
      ? this.mesesSeleccionados.filter(m => m !== mes)
      : [...this.mesesSeleccionados, mes];
  }

  etiquetaMeses(): string {
    const ordenados = this.meses.filter(m => this.mesesSeleccionados.includes(m));
    if (ordenados.length === 0) return 'Selecciona meses';
    return ordenados.map(m => m.charAt(0) + m.slice(1).toLowerCase()).join(', ');
  }

  cargarPublicaciones(): void {
    if (this.subTab === 'aprobadas') return;
    this.cargandoPublicaciones = true;
    this.cumpleanosService.listarPublicaciones(this.subTab, this.anioFiltro, this.mesesSeleccionados).subscribe({
      next: publicaciones => {
        this.publicaciones = publicaciones;
        this.cargandoPublicaciones = false;
      },
      error: error => {
        this.cargandoPublicaciones = false;
        this.error = this.mensajeError(error, 'No se pudieron cargar las publicaciones.');
      }
    });
  }

  nombreTarjeta(id: number): string {
    const tarjeta = this.tarjetasPublicadas.find(t => t.id === id);
    return tarjeta?.bailarin_nombre || `Tarjeta #${id}`;
  }

  private cargarTarjetasPublicadas(): void {
    this.solicitudPublicadas?.unsubscribe();
    this.cargandoPublicadas = true;
    this.solicitudPublicadas = this.cumpleanosService.listarTarjetasPublicadas().subscribe({
      next: tarjetas => this.tarjetasPublicadas = tarjetas,
      error: error => {
        this.cargandoPublicadas = false;
        this.error = this.mensajeError(error, 'No se pudieron cargar las tarjetas publicadas.');
      },
      complete: () => this.cargandoPublicadas = false
    });
  }

  private cargarTarjetasListasParaPublicar(): void {
    this.solicitudAprobadas = this.cumpleanosService.listarTarjetasListasParaPublicar().subscribe({
      next: tarjetas => {
        this.tarjetasAprobadas = tarjetas.map(t => ({ 
          ...t, 
          cargandoGeneracion: false, 
          cargandoPublicacion: false 
        }));
      },
      error: error => {
        this.error = this.mensajeError(error, 'No se pudieron cargar las tarjetas listas para publicar.');
        this.cargando = false;
      },
      complete: () => this.cargando = false
    });
  }

  abrirFormularioGeneracion(tarjeta: TarjetaAdmin): void {
    this.tarjetaSeleccionada = tarjeta;
    this.formGeneracion.enable();
    this.formGeneracion.reset({ imagen: null, mensaje_generado: '' });
    this.imagenSeleccionada = null;
    this.errorFormulario = '';
    this.mostrarFormularioGeneracion = true;
    this.error = '';
  }

  cerrarFormularioGeneracion(): void {
    if (this.tarjetaSeleccionada?.cargandoGeneracion || this.tarjetaSeleccionada?.cargandoPublicacion) return;
    this.mostrarFormularioGeneracion = false;
    this.tarjetaSeleccionada = null;
    this.imagenSeleccionada = null;
    this.formGeneracion.reset();
    this.errorFormulario = '';
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imagenSeleccionada = file;
    this.formGeneracion.patchValue({ imagen: file });
  }

  generarTarjetaManualmente(): void {
    this.formGeneracion.markAllAsTouched();
    if (this.formGeneracion.invalid || !this.tarjetaSeleccionada || this.tarjetaSeleccionada.cargandoGeneracion) return;

    const payload = this.formGeneracion.getRawValue();
    if (!payload.imagen) return;

    const tarjeta = this.tarjetaSeleccionada;
    tarjeta.cargandoGeneracion = true;
    this.errorFormulario = '';
    this.formGeneracion.disable();

    this.cumpleanosService.generarTarjetaManualmente(tarjeta.id, {
      imagen: payload.imagen,
      mensaje_generado: payload.mensaje_generado
    }).subscribe({
      next: tarjetaActualizada => {
        tarjeta.cargandoGeneracion = false;
        this.formGeneracion.enable();
        const index = this.tarjetasNoGeneradas.findIndex(t => t.id === tarjetaActualizada.id);
        if (index !== -1) {
          this.tarjetasNoGeneradas[index] = {
            ...tarjetaActualizada,
            publicaciones: tarjetaActualizada.publicaciones,
            cargandoGeneracion: false,
            cargandoPublicacion: false
          };
        }
        this.mostrarFormularioGeneracion = false;
        this.tarjetaSeleccionada = null;
        void Swal.fire({
          title: 'Tarjeta generada',
          text: 'El afiche se generó correctamente y se actualizó en la base de datos.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: error => {
        tarjeta.cargandoGeneracion = false;
        this.formGeneracion.enable();
        this.errorFormulario = this.mensajeError(error, 'No se pudo generar la tarjeta.');
      }
    });
  }

  aprobarYPublicar(tarjeta: TarjetaAdmin): void {
    if (tarjeta.cargandoPublicacion) return;
    tarjeta.cargandoPublicacion = true;
    this.error = '';

    this.cumpleanosService.aprobarTarjeta(tarjeta.id).subscribe({
      next: () => {
        tarjeta.cargandoPublicacion = false;
        this.tarjetasAprobadas = this.tarjetasAprobadas.filter(t => t.id !== tarjeta.id);
        this.cargarTarjetasPublicadas();
        void Swal.fire({
          title: 'Publicado correctamente',
          text: 'El afiche fue aprobado y publicado en redes sociales.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: error => {
        tarjeta.cargandoPublicacion = false;
        this.error = this.mensajeError(error, 'No se pudo publicar en las redes sociales.');
      }
    });
  }

  abrirFormularioPublicacion(tarjeta: TarjetaAdmin): void {
    if (tarjeta.estado_generacion !== 'GENERADA') {
      void Swal.fire({
        title: 'Error',
        text: 'Solo se pueden publicar tarjetas con afiche generado.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.tarjetaSeleccionada = tarjeta;
    this.formPublicacion.enable();
    this.formPublicacion.reset({
      plataformas: [],
      texto_publicacion: this.obtenerTextoPublicacionDefault(tarjeta)
    });
    this.abrirFormularioGeneracion(tarjeta);
  }

  togglePlataforma(plataforma: PlataformaRedSocial): void {
    const control = this.formPublicacion.get('plataformas');
    if (!control) return;

    const actuales = control.value as PlataformaRedSocial[];
    const nueva = actuales.includes(plataforma)
      ? actuales.filter(p => p !== plataforma)
      : [...actuales, plataforma];

    control.setValue(nueva);
  }

  publicarEnRedesSociales(): void {
    this.formPublicacion.markAllAsTouched();
    if (this.formPublicacion.invalid || !this.tarjetaSeleccionada || this.tarjetaSeleccionada.cargandoPublicacion) return;

    const payload = this.formPublicacion.getRawValue();
    if (payload.plataformas.length === 0) {
      this.errorFormulario = 'Selecciona al menos una red social.';
      return;
    }

    const tarjeta = this.tarjetaSeleccionada;
    tarjeta.cargandoPublicacion = true;
    this.errorFormulario = '';
    this.formPublicacion.disable();

    this.cumpleanosService.publicarEnRedesSociales(tarjeta.id, {
      plataformas: payload.plataformas,
      texto_publicacion: payload.texto_publicacion
    }).subscribe({
      next: tarjetaActualizada => {
        tarjeta.cargandoPublicacion = false;
        this.formPublicacion.enable();
        const index = this.tarjetasNoGeneradas.findIndex(t => t.id === tarjetaActualizada.id);
        if (index !== -1) {
          this.tarjetasNoGeneradas[index] = {
            ...tarjetaActualizada,
            publicaciones: tarjetaActualizada.publicaciones,
            cargandoGeneracion: false,
            cargandoPublicacion: false
          };
        }
        this.mostrarFormularioGeneracion = false;
        this.tarjetaSeleccionada = null;
        const plataformas = payload.plataformas.join(' e ');
        void Swal.fire({
          title: 'Publicado correctamente',
          text: `El afiche se compartió en ${plataformas}.`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: error => {
        tarjeta.cargandoPublicacion = false;
        this.formPublicacion.enable();
        this.errorFormulario = this.mensajeError(error, 'No se pudo publicar en las redes sociales.');
      }
    });
  }

  obtenerEtiquetaEstadoGeneracion(estado: EstadoGeneracion): string {
    return estado === 'GENERADA' ? 'Generado' : 'No generado';
  }

  obtenerTextoPublicacionDefault(tarjeta: TarjetaAdmin): string {
    return `¡Feliz cumpleaños ${tarjeta.bailarin.nombres} ${tarjeta.bailarin.apellidos}! 🎉`;
  }

  descargarTarjeta(url: string): void {
    if (!url) return;
    this.cumpleanosService.descargarTarjeta(url).subscribe({
      next: blob => {
        const link = document.createElement('a');
        const urlBlob = window.URL.createObjectURL(blob);
        link.href = urlBlob;
        link.download = `afiche_${new Date().getTime()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);
      },
      error: error => {
        console.error('Error al descargar tarjeta:', error);
        void Swal.fire({
          title: 'Error',
          text: 'No se pudo descargar el afiche.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  probarDetector(): void {
    if (this.probandoDetector) return;

    this.probandoDetector = true;
    this.detectorEjecutado = false;
    this.resultadoDetector = null;
    this.error = '';

    this.solicitudDetector = this.cumpleanosService.ejecutarDetector().subscribe({
      next: resultado => {
        this.resultadoDetector = resultado as ResultadoDetector;
        this.detectorEjecutado = true;
      },
      error: error => {
        this.error = this.mensajeError(error, 'No se pudo ejecutar el detector de afiches.');
        this.probandoDetector = false;
      },
      complete: () => {
        this.probandoDetector = false;
        if (this.detectorEjecutado) this.cargarTarjetas();
      }
    });
  }

  cerrarResultadoDetector(): void {
    this.detectorEjecutado = false;
    this.resultadoDetector = null;
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
