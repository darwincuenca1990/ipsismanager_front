import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { BailarinesService, DetalleErrorImportacion, ResultadoImportacionBailarines } from '../../services/bailarines.service';

interface ErrorFila {
  fila: number;
  detalles: string[];
}

@Component({
  selector: 'app-importar-bailarines',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importar-bailarines.component.html',
  styleUrl: './importar-bailarines.component.css'
})
export class ImportarBailarinesComponent implements OnDestroy {
  @Output() cerrar = new EventEmitter<void>();
  @Output() importados = new EventEmitter<void>();
  @ViewChild('archivoInput') archivoInput?: ElementRef<HTMLInputElement>;

  archivo: File | null = null;
  importando = false;
  error = '';
  resultado: ResultadoImportacionBailarines | null = null;
  errores: ErrorFila[] = [];
  private solicitud?: Subscription;

  constructor(private readonly servicio: BailarinesService) {}

  ngOnDestroy(): void {
    this.solicitud?.unsubscribe();
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.archivo = null;
    this.resultado = null;
    this.errores = [];
    this.error = '';
    if (!archivo) return;
    if (!/\.xlsx$/i.test(archivo.name)) {
      input.value = '';
      this.error = 'Selecciona un archivo Excel con extensión .xlsx.';
      return;
    }
    this.archivo = archivo;
  }

  importar(): void {
    if (this.importando || !this.archivo) return;
    this.importando = true;
    this.error = '';
    this.resultado = null;
    this.errores = [];
    this.solicitud = this.servicio.importarExcel(this.archivo).subscribe({
      next: resultado => {
        this.resultado = resultado;
        this.errores = resultado.errores.map(error => ({
          fila: error.fila,
          detalles: this.desglosarErrores(error.errores)
        }));
        this.importando = false;
        this.archivo = null;
        if (this.archivoInput) this.archivoInput.nativeElement.value = '';
        if (resultado.creados.length > 0) this.importados.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.importando = false;
        const detalle = error.error?.detail;
        this.error = typeof detalle === 'string'
          ? detalle
          : 'No se pudo importar el archivo. Verifica el archivo e inténtalo nuevamente.';
      }
    });
  }

  cerrarDialogo(): void {
    if (!this.importando) this.cerrar.emit();
  }

  private desglosarErrores(error: DetalleErrorImportacion, campo = ''): string[] {
    if (typeof error === 'string') return [campo ? `${campo}: ${error}` : error];
    if (Array.isArray(error)) return error.flatMap(item => this.desglosarErrores(item, campo));
    return Object.entries(error).flatMap(([clave, valor]) =>
      this.desglosarErrores(valor, campo ? `${campo}.${clave}` : clave)
    );
  }
}
