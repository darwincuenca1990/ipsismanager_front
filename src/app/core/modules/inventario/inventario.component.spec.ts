import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { InventarioService, TipoTraje } from '../../services/inventario.service';
import { InventarioComponent } from './inventario.component';

describe('InventarioComponent', () => {
  let component: InventarioComponent;
  let fixture: ComponentFixture<InventarioComponent>;
  let service: jasmine.SpyObj<InventarioService>;
  let listar: jasmine.Spy;
  const tipo: TipoTraje = {
    id: 1, nombre: 'Traje', variante: 'A', region_cultura: 'Sierra', descripcion: '',
    fotografia_referencia: null, estado: 'ACTIVO', fecha_registro: '', fecha_actualizacion: ''
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('InventarioService', ['listar', 'guardar', 'inactivarTipo', 'eliminar']);
    listar = jasmine.createSpy('listar').and.callFake((recurso: string) => recurso === 'tipos' ? of([tipo]) : of([]));
    await TestBed.configureTestingModule({
      imports: [InventarioComponent],
      providers: [{ provide: InventarioService, useValue: {
        listar, guardar: service.guardar, inactivarTipo: service.inactivarTipo, eliminar: service.eliminar
      } }]
    }).compileComponents();
    fixture = TestBed.createComponent(InventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga las cuatro listas y muestra los tipos', () => {
    expect(listar.calls.count()).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('Sierra');
  });

  it('crea y edita tipos con los campos y archivo adecuados', () => {
    service.guardar.and.returnValue(of(tipo));
    component.abrir();
    component.form.patchValue({ nombre: ' Traje ', variante: ' A ', region_cultura: ' Sierra ' });
    const archivo = new File(['datos'], 'foto.png', { type: 'image/png' });
    component.archivo = archivo;
    component.guardar();
    expect(service.guardar).toHaveBeenCalledWith('tipos', null, {
      nombre: 'Traje', variante: 'A', region_cultura: 'Sierra', descripcion: '', estado: 'ACTIVO'
    }, { campo: 'fotografia_referencia', valor: archivo });
    expect(component.mostrarFormulario).toBeFalse();
    component.abrir(tipo);
    component.guardar();
    expect(service.guardar).toHaveBeenCalledWith('tipos', 1, jasmine.any(Object), undefined);
  });

  it('valida cantidades y precisión monetaria en composición y adquisición', () => {
    component.seccion = 'composiciones';
    component.abrir();
    component.form.patchValue({ tipo_traje: 1, prenda: 2, cantidad_requerida: 0, precio_unitario: '1.00' });
    component.guardar();
    expect(service.guardar).not.toHaveBeenCalled();
    component.form.patchValue({ cantidad_requerida: 2, precio_unitario: '1.999' });
    component.guardar();
    expect(service.guardar).not.toHaveBeenCalled();
    service.guardar.and.returnValue(of({ id: 4, tipo_traje: 1, prenda: 2, cantidad_requerida: 2,
      precio_unitario: null, observaciones: '', estado: 'ACTIVO',
      prenda_detalle: { id: 2, nombre_prenda: 'Sombrero', descripcion: '', fotografia: null, observaciones: '', estado: 'ACTIVO' } }));
    component.form.patchValue({ precio_unitario: '' });
    component.guardar();
    expect(service.guardar).toHaveBeenCalledWith('composiciones', null, {
      tipo_traje: 1, prenda: 2, cantidad_requerida: 2, precio_unitario: null, observaciones: '', estado: 'ACTIVO'
    }, undefined);
    service.guardar.calls.reset();
    component.seccion = 'adquisiciones';
    component.abrir();
    component.form.patchValue({ tipo_traje: 1, fecha_adquisicion: '2026-11-12', cantidad_adquirida: 1, costo_unitario: '-1' });
    component.guardar();
    expect(service.guardar).not.toHaveBeenCalled();
    service.guardar.and.returnValue(of({ id: 8, tipo_traje: 1, fecha_adquisicion: '2026-11-12',
      cantidad_adquirida: 1, costo_unitario: '0.00', costo_total: '0.00', proveedor: '', observaciones: '',
      comprobante: null, fecha_registro: '' }));
    component.form.patchValue({ costo_unitario: '0.00' });
    component.guardar();
    expect(service.guardar).toHaveBeenCalledWith('adquisiciones', null, {
      tipo_traje: 1, fecha_adquisicion: '2026-11-12', cantidad_adquirida: 1,
      costo_unitario: '0.00', proveedor: '', observaciones: ''
    }, undefined);
  });

  it('conserva el formulario y muestra errores del servidor', () => {
    service.guardar.and.returnValue(throwError(() => ({ error: { nombre_prenda: ['Ya existe'] } })));
    component.seccion = 'prendas';
    component.abrir();
    component.form.patchValue({ nombre_prenda: 'Sombrero' });
    component.guardar();
    expect(component.errorFormulario).toContain('nombre_prenda: Ya existe');
    expect(component.mostrarFormulario).toBeTrue();
    expect(component.guardando).toBeFalse();
  });

  it('impide solicitudes duplicadas y cerrar durante el guardado', () => {
    const pendiente = new Subject<TipoTraje>();
    service.guardar.and.returnValue(pendiente);
    component.abrir(tipo);
    component.guardar();
    component.guardar();
    component.cerrar();
    expect(service.guardar).toHaveBeenCalledTimes(1);
    expect(component.mostrarFormulario).toBeTrue();
    pendiente.next(tipo);
    expect(component.mostrarFormulario).toBeFalse();
    expect(listar.calls.count()).toBe(8);
  });
});
