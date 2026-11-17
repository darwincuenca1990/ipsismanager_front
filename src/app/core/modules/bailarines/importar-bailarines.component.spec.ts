import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { BailarinesService, ResultadoImportacionBailarines } from '../../services/bailarines.service';
import { ImportarBailarinesComponent } from './importar-bailarines.component';

describe('ImportarBailarinesComponent', () => {
  let fixture: ComponentFixture<ImportarBailarinesComponent>;
  let component: ImportarBailarinesComponent;
  let service: jasmine.SpyObj<BailarinesService>;
  const archivo = new File(['datos'], 'bailarines.xlsx');
  const resultado: ResultadoImportacionBailarines = {
    creados: [{ fila: 3, id: 101 }, { fila: 4, id: 102 }],
    errores: [
      { fila: 8, errores: { cedula: ['Ya existe'] } },
      { fila: 9, errores: { representante: 'Indique Padre o Madre.' } },
      { fila: 12, errores: { inscripcion: { estado: ['Este campo es requerido.'] } } }
    ]
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('BailarinesService', ['importarExcel']);
    await TestBed.configureTestingModule({
      imports: [ImportarBailarinesComponent],
      providers: [{ provide: BailarinesService, useValue: service }]
    }).compileComponents();
    fixture = TestBed.createComponent(ImportarBailarinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function seleccionar(file: File): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
    const transferencia = new DataTransfer();
    transferencia.items.add(file);
    input.files = transferencia.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('solo acepta archivos xlsx', () => {
    seleccionar(new File(['datos'], 'archivo.xls'));
    expect(component.archivo).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('extensión .xlsx');
    component.importar();
    expect(service.importarExcel).not.toHaveBeenCalled();
    seleccionar(archivo);
    expect(component.archivo).toBe(archivo);
    expect(component.error).toBe('');
  });

  it('muestra la cantidad creada y los errores por fila y campo anidado', () => {
    service.importarExcel.and.returnValue(of(resultado));
    const emitido = spyOn(component.importados, 'emit');
    seleccionar(archivo);
    component.importar();
    fixture.detectChanges();
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('2 registros creados correctamente');
    expect(texto).toContain('3 filas con errores');
    expect(texto).toContain('Fila 8');
    expect(texto).toContain('cedula: Ya existe');
    expect(texto).toContain('representante: Indique Padre o Madre.');
    expect(texto).toContain('inscripcion.estado: Este campo es requerido.');
    expect(emitido).toHaveBeenCalledTimes(1);
    expect(component.archivo).toBeNull();
    seleccionar(archivo);
    expect(component.archivo).toBe(archivo);
  });

  it('impide solicitudes duplicadas y cerrar durante la importación', () => {
    const pendiente = new Subject<ResultadoImportacionBailarines>();
    service.importarExcel.and.returnValue(pendiente);
    const cerrar = spyOn(component.cerrar, 'emit');
    seleccionar(archivo);
    component.importar();
    component.importar();
    component.cerrarDialogo();
    expect(service.importarExcel).toHaveBeenCalledTimes(1);
    expect(cerrar).not.toHaveBeenCalled();
    pendiente.next({ creados: [], errores: [] });
    expect(component.importando).toBeFalse();
    component.cerrarDialogo();
    expect(cerrar).toHaveBeenCalled();
  });

  it('permite reintentar cuando falla la solicitud', () => {
    service.importarExcel.and.returnValue(throwError(() => ({ error: { detail: 'Archivo inválido' } })));
    seleccionar(archivo);
    component.importar();
    expect(component.error).toBe('Archivo inválido');
    expect(component.archivo).toBe(archivo);
    expect(component.importando).toBeFalse();
  });
});
