import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Dropdown } from 'primeng/dropdown';
import { MultiSelect } from 'primeng/multiselect';
import { of, throwError } from 'rxjs';
import { Bailarin, BailarinesService } from '../../services/bailarines.service';
import { CoreografiasService } from '../../services/coreografias.service';
import { Presentacion, PresentacionesService } from '../../services/presentaciones.service';
import { PresentacionesComponent } from './presentaciones.component';

describe('PresentacionesComponent', () => {
  let component: PresentacionesComponent;
  let fixture: ComponentFixture<PresentacionesComponent>;
  let service: jasmine.SpyObj<PresentacionesService>;
  let bailarinesService: jasmine.SpyObj<BailarinesService>;
  const bailarines = [
    { id: 1, nombres: 'Juan', apellidos: 'Paz', genero: 'MASCULINO', elenco: 'PLANTA' },
    { id: 2, nombres: 'Ana', apellidos: 'Sol', genero: 'FEMENINO', elenco: 'INFANTIL' },
    { id: 3, nombres: 'Eva', apellidos: 'Luz', genero: null, elenco: 'MÁSTER' }
  ] as Bailarin[];
  const presentacion: Presentacion = {
    id: 5, fecha: '2026-11-11', hora_presentacion: '10:00:00', lugar: 'Loja',
    persona_cargo: 1, costo_total_presentacion: '200.25', costo_transporte: '50.10',
    costo_neto: '150.15', nombre_transporte: 'Bus', tipo_presentacion: 'FESTIVALIPSIS',
    elencos: ['INFANTIL', 'PLANTA'], bitacora: [
      { bailarin: 1, coreografias: [10] }, { bailarin: 2, coreografias: [10, 11] }
    ]
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('PresentacionesService', ['listar', 'obtener', 'crear', 'actualizar']);
    service.listar.and.returnValue(of([presentacion]));
    service.obtener.and.returnValue(of(presentacion));
    service.crear.and.returnValue(of(presentacion));
    service.actualizar.and.returnValue(of(presentacion));
    bailarinesService = jasmine.createSpyObj('BailarinesService', ['listar']);
    bailarinesService.listar.and.callFake(filtros => of(filtros.estado === 'ACTIVO' ? bailarines : []));
    const coreografiasService = jasmine.createSpyObj('CoreografiasService', ['listar']);
    coreografiasService.listar.and.returnValue(of([
      { id: 10, nombre: 'Danza', region: 'Sierra', descripcion: 'Texto', url_video: 'https://example.com' },
      { id: 11, nombre: 'Danza 2', region: 'Sierra', descripcion: 'Texto', url_video: 'https://example.com' }
    ]));
    await TestBed.configureTestingModule({
      imports: [PresentacionesComponent],
      providers: [
        { provide: PresentacionesService, useValue: service },
        { provide: BailarinesService, useValue: bailarinesService },
        { provide: CoreografiasService, useValue: coreografiasService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(PresentacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filtra los elencos y ordena mujeres, hombres y género no registrado', () => {
    component.nuevo();
    component.form.controls.tipo_presentacion.setValue('FESTIVALIPSIS');
    component.seleccionarElenco('PLANTA', true);
    component.seleccionarElenco('INFANTIL', true);
    component.seleccionarElenco('MÁSTER', true);
    expect(component.bailarinesVisibles.map(b => b.id)).toEqual([2, 1, 3]);
    expect(component.personasCargo.map(b => b.id)).toEqual([3, 1]);
  });

  it('abre el formulario al pulsar Nueva presentación', fakeAsync(() => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.page-heading button');
    expect(boton.disabled).toBeFalse();
    boton.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#selector-elenco-unico')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#selector-coreografias')).toBeTruthy();
  }));

  it('mantiene estable el valor de coreografías mientras no cambie la selección', () => {
    component.nuevo();
    expect(component.idsCoreografiasSeleccionadas).toBe(component.idsCoreografiasSeleccionadas);
  });

  it('estabiliza el formulario después de abrirlo', async () => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.page-heading button');
    boton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('calcula el costo neto en centavos y valida los importes', () => {
    component.form.controls.costo_total_presentacion.setValue('200.25');
    component.form.controls.costo_transporte.setValue('50.10');
    expect(component.costoNeto).toBe('150.15');
    component.form.controls.costo_transporte.setValue('-1');
    expect(component.costoNeto).toBe('—');
  });

  it('selecciona múltiples coreografías desde el desplegable y actualiza la tabla', fakeAsync(() => {
    component.nuevo();
    component.seleccionarUnElenco('PLANTA');
    component.seleccionarBailarin(1, true);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const selector = fixture.debugElement.query(By.css('#selector-coreografias')).componentInstance as MultiSelect;
    expect(selector.options?.length).toBe(2);
    selector.updateModel([10, 11]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.assignment-table thead th').length).toBe(4);
    component.asignarCoreografia(1, 10, true);
    selector.updateModel([11]);
    fixture.detectChanges();
    expect(component.asignaciones.get(1)?.has(10)).toBeFalse();
    expect(component.coreografiasSeleccionadas.has(11)).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.assignment-table thead th').length).toBe(3);
  }));

  it('muestra en el desplegable las coreografías guardadas al editar', fakeAsync(() => {
    component.editar(5);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const selector = fixture.debugElement.query(By.css('#selector-coreografias')).componentInstance as MultiSelect;
    expect(selector.value).toEqual([10, 11]);
  }));

  it('usa selectores PrimeNG para un elenco y varios elencos', fakeAsync(() => {
    component.nuevo();
    fixture.detectChanges();
    tick();
    expect(fixture.nativeElement.querySelector('p-dropdown#selector-elenco-unico')).toBeTruthy();
    component.form.controls.tipo_presentacion.setValue('FESTIVALIPSIS');
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const selector = fixture.debugElement.query(By.css('#selector-elencos')).componentInstance as MultiSelect;
    selector.updateModel(['INFANTIL', 'PLANTA']);
    fixture.detectChanges();
    expect(component.elencos).toEqual(['INFANTIL', 'PLANTA']);
    expect(component.bailarinesVisibles.map(b => b.id)).toEqual([2, 1]);
  }));

  it('usa PrimeNG para persona a cargo y tipo conservando los valores del formulario', fakeAsync(() => {
    component.nuevo();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const persona = fixture.debugElement.query(By.css('#selector-persona-cargo')).componentInstance as Dropdown;
    const tipo = fixture.debugElement.query(By.css('#selector-tipo-presentacion')).componentInstance as Dropdown;
    expect(persona.options?.map(opcion => opcion.value)).toEqual(['3', '1']);
    expect(component.form.controls.persona_cargo.invalid).toBeTrue();
    persona.onOptionSelect(new Event('click'), component.opcionesPersonaCargo[1]);
    tipo.onOptionSelect(new Event('click'), component.opcionesTipoPresentacion[1]);
    fixture.detectChanges();
    expect(component.form.controls.persona_cargo.value).toBe('1');
    expect(component.form.controls.tipo_presentacion.value).toBe('FESTIVALIPSIS');
    expect(fixture.nativeElement.querySelector('p-multiselect#selector-elencos')).toBeTruthy();
    component.elencos = ['INFANTIL', 'PLANTA'];
    tipo.onOptionSelect(new Event('click'), component.opcionesTipoPresentacion[0]);
    fixture.detectChanges();
    expect(component.elencos).toEqual([]);
  }));

  it('carga en PrimeNG la persona a cargo y el tipo al editar', fakeAsync(() => {
    component.editar(5);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const persona = fixture.debugElement.query(By.css('#selector-persona-cargo')).componentInstance as Dropdown;
    const tipo = fixture.debugElement.query(By.css('#selector-tipo-presentacion')).componentInstance as Dropdown;
    expect(persona.value).toBe('1');
    expect(tipo.value).toBe('FESTIVALIPSIS');
  }));

  it('recupera y actualiza la bitácora sin asignar todas las coreografías a todos', () => {
    component.editar(5);
    expect(component.asignaciones.get(1)?.has(11)).toBeFalse();
    expect(component.asignaciones.get(2)?.has(11)).toBeTrue();
    component.guardar();
    expect(service.actualizar).toHaveBeenCalledWith(5, jasmine.objectContaining({
      tipo_presentacion: 'FESTIVALIPSIS', elencos: ['INFANTIL', 'PLANTA'],
      bitacora: [{ bailarin: 1, coreografias: [10] }, { bailarin: 2, coreografias: [10, 11] }]
    }));
  });

  it('crea una presentación con un elenco y envía la bitácora seleccionada', () => {
    component.nuevo();
    component.form.patchValue({
      fecha: '2026-11-11', hora_presentacion: '10:00', lugar: ' Loja ', persona_cargo: '1',
      costo_total_presentacion: '200.25', costo_transporte: '50.10', nombre_transporte: ' Bus '
    });
    component.seleccionarUnElenco('PLANTA');
    component.seleccionarCoreografia(10, true);
    component.seleccionarBailarin(1, true);
    component.asignarCoreografia(1, 10, true);
    component.guardar();
    expect(service.crear).toHaveBeenCalledWith(jasmine.objectContaining({
      lugar: 'Loja', nombre_transporte: 'Bus', persona_cargo: 1, tipo_presentacion: 'UN ELENCO',
      elencos: ['PLANTA'], bitacora: [{ bailarin: 1, coreografias: [10] }]
    }));
    expect(component.mensajeExito).toContain('creada');
  });

  it('impide perder coreografías sin asignaciones', () => {
    component.editar(5);
    component.asignarCoreografia(2, 11, false);
    component.guardar();
    expect(component.errorFormulario).toContain('Cada coreografía');
    expect(service.actualizar).not.toHaveBeenCalled();
  });

  it('conserva los bailarines fuera del nuevo elenco y exige retirarlos explícitamente', () => {
    component.editar(5);
    component.form.controls.tipo_presentacion.setValue('UN ELENCO');
    component.cambiarTipo();
    component.seleccionarUnElenco('PLANTA');
    expect(component.bailarinesVisibles.map(b => b.id)).toContain(2);
    component.guardar();
    expect(component.errorFormulario).toContain('no pertenecen');
    expect(service.actualizar).not.toHaveBeenCalled();
  });

  it('muestra errores del API y conserva el formulario', () => {
    service.actualizar.and.returnValue(throwError(() => ({ error: { lugar: ['No válido'] } })));
    component.editar(5);
    component.guardar();
    expect(component.errorFormulario).toContain('No válido');
    expect(component.mostrandoFormulario).toBeTrue();
    expect(component.guardando).toBeFalse();
  });
});
