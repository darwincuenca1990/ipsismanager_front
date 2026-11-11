import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Dropdown } from 'primeng/dropdown';
import { MultiSelect } from 'primeng/multiselect';
import { Paginator } from 'primeng/paginator';
import { of, Subject, throwError } from 'rxjs';
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
    { id: 2, nombres: 'Ana', apellidos: 'Sol', cedula: '1234567890', genero: 'FEMENINO', elenco: 'INFANTIL' },
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
    const hoy = new Date();
    const fechaActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
    service.listar.and.returnValue(of([{ ...presentacion, fecha: fechaActual }]));
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

  it('inicia con mes y año actuales y ofrece los rangos de selección solicitados', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const hoy = new Date();
    expect(component.filtros.meses).toEqual([hoy.getMonth() + 1]);
    expect(component.filtros.anios).toEqual([hoy.getFullYear()]);
    expect(component.opcionesMeses.map(opcion => opcion.label)).toEqual([
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]);
    expect(component.opcionesAnios[0].value).toBe(2013);
    expect(component.opcionesAnios[component.opcionesAnios.length - 1].value).toBe(hoy.getFullYear() + 1);
    expect(component.presentacionesPagina.length).toBe(1);
    const meses = fixture.debugElement.query(By.css('p-multiselect[inputId="filtro-meses"]')).componentInstance as MultiSelect;
    const anios = fixture.debugElement.query(By.css('p-multiselect[inputId="filtro-anios"]')).componentInstance as MultiSelect;
    expect(meses.value).toEqual([hoy.getMonth() + 1]);
    expect(anios.value).toEqual([hoy.getFullYear()]);
  }));

  it('combina múltiples meses y años, recupera páginas del servidor y pagina de diez en diez', fakeAsync(() => {
    const datos: Presentacion[] = Array.from({ length: 25 }, (_, indice) => ({
      ...presentacion, id: indice + 1, fecha: `${indice % 2 ? 2023 : 2024}-${indice % 3 ? '02' : '01'}-15`
    }));
    datos.push({ ...presentacion, id: 26, fecha: '2022-03-15' });
    service.listar.and.callFake((_filtros, enlace) => enlace
      ? of({ results: datos.slice(13), next: null, previous: '?page=1', count: datos.length })
      : of({ results: datos.slice(0, 13), next: '?page=2', previous: null, count: datos.length }));
    tick();
    fixture.detectChanges();
    const meses = fixture.debugElement.query(By.css('p-multiselect[inputId="filtro-meses"]')).componentInstance as MultiSelect;
    const anios = fixture.debugElement.query(By.css('p-multiselect[inputId="filtro-anios"]')).componentInstance as MultiSelect;
    meses.updateModel([1, 2]);
    anios.updateModel([2023, 2024]);
    component.filtros.lugar = ' Loja ';
    fixture.detectChanges();
    component.aplicarFiltros();
    tick();
    fixture.detectChanges();
    expect(service.listar).toHaveBeenCalledWith({ lugar: 'Loja' }, '?page=2');
    expect(component.presentacionesFiltradas.length).toBe(25);
    expect(component.presentacionesPagina.length).toBe(10);
    const paginador = fixture.debugElement.query(By.directive(Paginator)).componentInstance as Paginator;
    paginador.changePage(2);
    fixture.detectChanges();
    expect(component.primeraFila).toBe(20);
    expect(component.presentacionesPagina.map(item => item.id)).toEqual([21, 22, 23, 24, 25]);
    meses.updateModel([1]);
    fixture.detectChanges();
    component.aplicarFiltros();
    tick();
    fixture.detectChanges();
    expect(component.primeraFila).toBe(0);
    expect(component.presentacionesFiltradas.map(item => item.id)).toEqual([1, 4, 7, 10, 13, 16, 19, 22, 25]);
    meses.updateModel([]);
    anios.updateModel([]);
    fixture.detectChanges();
    component.aplicarFiltros();
    tick();
    fixture.detectChanges();
    expect(component.presentacionesFiltradas.length).toBe(26);
    component.cambiarPagina({ first: 20 });
    service.listar.and.returnValue(of(datos.slice(0, 12)));
    component.cargar();
    expect(component.primeraFila).toBe(10);
    expect(component.presentacionesPagina.length).toBe(2);
  }));

  it('cancela solicitudes anteriores y muestra errores de carga', () => {
    const anterior = new Subject<Presentacion[]>();
    const actual = new Subject<Presentacion[]>();
    service.listar.and.returnValues(anterior, actual);
    component.cargar();
    component.aplicarFiltros();
    expect(anterior.observed).toBeFalse();
    actual.error(new Error('Error de consulta'));
    expect(component.errorListado).toBe('Error de consulta');
    expect(component.presentaciones.length).toBe(0);
    expect(component.cargando).toBeFalse();
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

  it('muestra el detalle recuperado en una vista de solo lectura y permite cerrarla', () => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.list-actions button');
    boton.click();
    fixture.detectChanges();
    expect(service.obtener).toHaveBeenCalledWith(5);
    const detalle: HTMLElement = fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]');
    expect(detalle).toBeTruthy();
    for (const valor of ['2026-11-11', '10:00:00', 'Loja', 'Paz Juan', '200.25', '50.10', '150.15', 'Bus', 'FESTIVALIPSIS', 'INFANTIL', 'PLANTA', 'Danza', 'Danza 2']) {
      expect(detalle.textContent).toContain(valor);
    }
    const filas = detalle.querySelectorAll('.assignment-table tbody tr:not(.elenco-separator)');
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('Sol Ana');
    expect(filas[0].querySelectorAll('td')[2].textContent?.trim()).toBe('Sí');
    expect(filas[0].querySelectorAll('td')[3].textContent?.trim()).toBe('Sí');
    expect(filas[1].textContent).toContain('Paz Juan');
    expect(filas[1].querySelectorAll('td')[2].textContent?.trim()).toBe('Sí');
    expect(filas[1].querySelectorAll('td')[3].textContent?.trim()).toBe('No');
    expect(detalle.querySelector('input, select, textarea, form, p-dropdown, p-multiselect')).toBeNull();
    expect(service.crear).not.toHaveBeenCalled();
    expect(service.actualizar).not.toHaveBeenCalled();
    detalle.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
    fixture.detectChanges();
    expect(component.detalle).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]')).toBeNull();
  });

  it('muestra identificadores si faltan bailarines o coreografías del catálogo', () => {
    service.obtener.and.returnValue(of({
      ...presentacion, persona_cargo: 99, bitacora: [{ bailarin: 99, coreografias: [99] }]
    }));
    component.ver(5);
    fixture.detectChanges();
    const detalle: HTMLElement = fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]');
    expect(detalle.textContent).toContain('Bailarín #99');
    expect(detalle.textContent).toContain('Coreografía #99');
    expect(detalle.querySelector('.elenco-separator')?.textContent).toContain('SIN ELENCO');
  });

  it('agrupa el detalle de Festival Ipsis por elenco y conserva el orden por género', () => {
    component.bailarines = [
      ...bailarines,
      { ...bailarines[0], id: 4, nombres: 'Beatriz', apellidos: 'Alba', genero: 'FEMENINO' },
      { ...bailarines[0], id: 5, nombres: 'Carlos', apellidos: 'Alba', genero: null }
    ];
    service.obtener.and.returnValue(of({
      ...presentacion,
      bitacora: [
        ...presentacion.bitacora,
        { bailarin: 4, coreografias: [11] },
        { bailarin: 5, coreografias: [] }
      ]
    }));
    component.ver(5);
    fixture.detectChanges();
    const grupos: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('[aria-labelledby="detalle-presentacion-titulo"] .assignment-table tbody');
    expect(grupos.length).toBe(2);
    expect(grupos[0].querySelector('.elenco-separator')?.textContent).toContain('INFANTIL');
    expect(grupos[1].querySelector('.elenco-separator')?.textContent).toContain('PLANTA');
    expect(grupos[1].querySelector('.elenco-separator th')?.getAttribute('colspan')).toBe('5');
    const nombres = Array.from(grupos[1].querySelectorAll('tr:not(.elenco-separator) th')).map(celda => celda.textContent?.trim());
    expect(nombres).toEqual(['Alba Beatriz', 'Paz Juan', 'Alba Carlos']);
    const filas = grupos[1].querySelectorAll('tr:not(.elenco-separator)');
    expect(Array.from(filas[0].querySelectorAll('td')).slice(2).map(celda => celda.textContent?.trim())).toEqual(['No', 'Sí']);
    expect(Array.from(filas[1].querySelectorAll('td')).slice(2).map(celda => celda.textContent?.trim())).toEqual(['Sí', 'No']);
    expect(Array.from(filas[2].querySelectorAll('td')).slice(2).map(celda => celda.textContent?.trim())).toEqual(['No', 'No']);
  });

  it('no muestra separadores en presentaciones de un elenco o festivales con un solo elenco', () => {
    for (const tipo of ['UN ELENCO', 'FESTIVALIPSIS'] as const) {
      service.obtener.and.returnValue(of({ ...presentacion, tipo_presentacion: tipo, elencos: ['PLANTA'] }));
      component.ver(5);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"] .elenco-separator')).toBeNull();
      expect(component.gruposBitacoraDetalle[0].elementos.map(registro => registro.bailarin)).toEqual([2, 1]);
    }
  });

  it('mantiene el mensaje de bitácora vacía en el detalle agrupado', () => {
    service.obtener.and.returnValue(of({ ...presentacion, bitacora: [] }));
    component.ver(5);
    fixture.detectChanges();
    const detalle: HTMLElement = fixture.nativeElement.querySelector('[aria-labelledby="detalle-presentacion-titulo"]');
    expect(detalle.querySelector('.elenco-separator')).toBeNull();
    expect(detalle.textContent).toContain('No hay bailarines registrados');
  });

  it('muestra el error cuando no se puede recuperar el detalle', () => {
    service.obtener.and.returnValue(throwError(() => new Error('Error al consultar')));
    component.ver(5);
    fixture.detectChanges();
    expect(component.cargando).toBeFalse();
    expect(component.errorListado).toContain('Error al consultar');
    expect(component.detalle).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Error al consultar');
  });

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

  it('agrupa por elenco en Festival Ipsis y conserva el orden y las asignaciones al buscar', () => {
    component.bailarines = [
      ...bailarines,
      { ...bailarines[0], id: 4, nombres: 'Beatriz', apellidos: 'Alba', genero: 'FEMENINO' },
      { ...bailarines[0], id: 5, nombres: 'Carlos', apellidos: 'Alba', elenco: 'INFANTIL' }
    ];
    component.activos = new Set([1, 2, 3, 4, 5]);
    component.nuevo();
    component.form.controls.tipo_presentacion.setValue('FESTIVALIPSIS');
    component.elencos = ['PLANTA', 'INFANTIL'];
    component.seleccionarCoreografia(10, true);
    component.seleccionarBailarin(1, true);
    component.asignarCoreografia(1, 10, true);
    fixture.detectChanges();

    expect(component.gruposBailarines.map(grupo => grupo.elenco)).toEqual(['INFANTIL', 'PLANTA']);
    expect(component.gruposBailarines.map(grupo => grupo.bailarines.map(b => b.id))).toEqual([[2, 5], [4, 1]]);
    const grupos: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.assignment-table tbody');
    expect(grupos.length).toBe(2);
    expect(grupos[0].querySelector('th')?.textContent).toContain('INFANTIL');
    expect(grupos[1].querySelector('th')?.textContent).toContain('PLANTA');
    expect(grupos[1].querySelector('th')?.getAttribute('colspan')).toBe('3');

    component.busquedaBailarin = 'Ana';
    fixture.detectChanges();
    expect(component.gruposBailarines.map(grupo => grupo.elenco)).toEqual(['INFANTIL']);
    expect(component.asignaciones.get(1)?.has(10)).toBeTrue();
    component.busquedaBailarin = '';
    component.elencos = ['INFANTIL'];
    fixture.detectChanges();
    expect(component.hayAsignacionesFueraDelElenco).toBeTrue();
    expect(component.gruposBailarines.map(grupo => grupo.elenco)).toEqual(['INFANTIL', 'PLANTA']);
    expect(component.gruposBailarines[1].bailarines.map(b => b.id)).toEqual([1]);

    component.form.controls.tipo_presentacion.setValue('UN ELENCO');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.assignment-table .elenco-separator').length).toBe(0);
    expect(component.asignaciones.get(1)?.has(10)).toBeTrue();
  });

  it('mantiene los controles de la matriz estables y seleccionables entre ciclos de detección', fakeAsync(() => {
    component.nuevo();
    component.form.patchValue({
      fecha: '2026-11-11', hora_presentacion: '10:00', lugar: 'Loja', persona_cargo: '1',
      costo_total_presentacion: '100', costo_transporte: '20', nombre_transporte: 'Bus',
      tipo_presentacion: 'FESTIVALIPSIS'
    });
    component.elencos = ['INFANTIL', 'PLANTA'];
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const selector = fixture.debugElement.query(By.css('#selector-coreografias')).componentInstance as MultiSelect;
    selector.updateModel([10, 11]);
    fixture.detectChanges();
    const grupos: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.assignment-table tbody');
    const seleccion: HTMLInputElement = grupos[1].querySelector('input[type="checkbox"]')!;
    seleccion.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(grupos[1]).toBe(fixture.nativeElement.querySelectorAll('.assignment-table tbody')[1]);
    expect(seleccion).toBe(grupos[1].querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    seleccion.click();
    fixture.detectChanges();
    expect(seleccion.checked).toBeTrue();
    expect(component.asignaciones.has(1)).toBeTrue();

    const danza: HTMLInputElement = grupos[1].querySelector('input[aria-label="Danza para Juan Paz"]')!;
    const danzaDos: HTMLInputElement = grupos[1].querySelector('input[aria-label="Danza 2 para Juan Paz"]')!;
    expect(danza.disabled).toBeFalse();
    danza.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(danza).toBe(grupos[1].querySelector<HTMLInputElement>('input[aria-label="Danza para Juan Paz"]')!);
    danza.click();
    danzaDos.click();
    fixture.detectChanges();
    expect(danza.checked).toBeTrue();
    expect(danzaDos.checked).toBeTrue();
    expect([...component.asignaciones.get(1)!]).toEqual([10, 11]);
    component.guardar();
    expect(service.crear).toHaveBeenCalledWith(jasmine.objectContaining({
      bitacora: [{ bailarin: 1, coreografias: [10, 11] }]
    }));
  }));

  it('permite modificar las selecciones existentes en una presentación editada', () => {
    component.editar(5);
    fixture.detectChanges();
    const danza: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-label="Danza para Juan Paz"]');
    danza.click();
    fixture.detectChanges();
    expect(component.asignaciones.get(1)?.has(10)).toBeFalse();
    danza.click();
    fixture.detectChanges();
    expect(component.asignaciones.get(1)?.has(10)).toBeTrue();
    const fila = danza.closest('tr')!;
    const seleccion: HTMLInputElement = fila.querySelector('input[type="checkbox"]')!;
    seleccion.click();
    fixture.detectChanges();
    expect(component.asignaciones.has(1)).toBeFalse();
    expect(danza.disabled).toBeTrue();
  });

  it('usa PrimeNG para persona a cargo y tipo conservando los valores del formulario', fakeAsync(() => {
    component.nuevo();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const persona = fixture.debugElement.query(By.css('#selector-persona-cargo')).componentInstance as Dropdown;
    const tipo = fixture.debugElement.query(By.css('#selector-tipo-presentacion')).componentInstance as Dropdown;
    expect(persona.options?.map(opcion => opcion.value)).toEqual(['3', '1']);
    expect(persona.filter).toBeTrue();
    persona.filterValue = 'juan';
    tick();
    fixture.detectChanges();
    expect(persona.visibleOptions().map((opcion: { value: string }) => opcion.value)).toEqual(['1']);
    persona.filterValue = '';
    tick();
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
    tick(1000);
  }));

  it('busca bailarines sin perder asignaciones, incluso al guardar o cambiar de elenco', () => {
    component.editar(5);
    fixture.detectChanges();
    const buscador: HTMLInputElement = fixture.nativeElement.querySelector('.dancer-search input');
    const buscar = (valor: string) => {
      buscador.value = valor;
      buscador.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    buscar('ÁNA sol');
    expect(component.bailarinesFiltrados.map(b => b.id)).toEqual([2]);
    expect(fixture.nativeElement.querySelectorAll('.assignment-table tbody tr:not(.elenco-separator)').length).toBe(1);
    buscar('1234567890');
    expect(component.bailarinesFiltrados.map(b => b.id)).toEqual([2]);
    buscar('inexistente');
    expect(fixture.nativeElement.querySelector('.assignment-table tbody').textContent).toContain('No hay bailarines que coincidan');
    expect(component.asignaciones.get(1)?.has(10)).toBeTrue();
    expect(component.asignaciones.get(2)?.has(11)).toBeTrue();
    component.guardar();
    expect(service.actualizar).toHaveBeenCalledWith(5, jasmine.objectContaining({
      bitacora: [{ bailarin: 1, coreografias: [10] }, { bailarin: 2, coreografias: [10, 11] }]
    }));

    component.editar(5);
    expect(component.busquedaBailarin).toBe('');
    component.busquedaBailarin = 'Juan';
    component.seleccionarUnElenco('PLANTA');
    expect(component.hayAsignacionesFueraDelElenco).toBeTrue();
    expect(component.bailarinesFiltrados.map(b => b.id)).toEqual([1]);
    component.busquedaBailarin = '';
    expect(component.bailarinesFiltrados.map(b => b.id)).toContain(2);
    component.busquedaBailarin = 'Ana';
    component.nuevo();
    expect(component.busquedaBailarin).toBe('');
  });

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
