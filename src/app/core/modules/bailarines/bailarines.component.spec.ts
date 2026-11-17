import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Dropdown } from 'primeng/dropdown';
import { Paginator } from 'primeng/paginator';
import { of, Subject } from 'rxjs';
import { Bailarin, BailarinesService, FiltrosBailarines } from '../../services/bailarines.service';
import { CommonsService } from '../../services/commons.service';

import { BailarinesComponent } from './bailarines.component';

describe('BailarinesComponent', () => {
  let component: BailarinesComponent;
  let fixture: ComponentFixture<BailarinesComponent>;
  let listar: jasmine.Spy;

  beforeEach(async () => {
    listar = jasmine.createSpy('listar').and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [BailarinesComponent, NoopAnimationsModule],
      providers: [
        { provide: BailarinesService, useValue: { listar } },
        { provide: CommonsService, useValue: { opcionesElenco: [{ value: 'PLANTA', label: 'Planta' }] } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BailarinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abre la importación y actualiza el listado cuando se crean bailarines', () => {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.heading-actions .btn-outline-primary');
    boton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-importar-bailarines')).toBeTruthy();
    listar.calls.reset();
    component.actualizarTrasImportacion();
    expect(listar).toHaveBeenCalledWith({ elenco: 'todos', estado: 'ACTIVO' });
  });

  it('filtra por elenco y permite volver a todos los elencos', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const dropdown = fixture.debugElement.query(By.css('p-dropdown[inputId="filtro-elenco"]')).componentInstance as Dropdown;
    expect(dropdown.value).toBe('TODOS');
    expect(dropdown.options?.map(opcion => opcion.value)).toEqual(['TODOS', 'PLANTA']);

    dropdown.onOptionSelect(new Event('click'), component.opcionesFiltroElenco[1]);
    tick();
    fixture.detectChanges();
    expect(component.filtroElenco).toBe('PLANTA');
    expect(listar).toHaveBeenCalledWith({ elenco: 'PLANTA', estado: 'ACTIVO' });

    dropdown.onOptionSelect(new Event('click'), component.opcionesFiltroElenco[0]);
    tick();
    fixture.detectChanges();
    expect(component.filtroElenco).toBe('TODOS');
    expect(listar).toHaveBeenCalledWith({ elenco: 'todos', estado: 'ACTIVO' });
  }));

  it('filtra por género y muestra diez registros por página, incluyendo las páginas del servidor', fakeAsync(() => {
    const bailarines: Bailarin[] = Array.from({ length: 25 }, (_, indice) => ({
      id: indice + 1, grupo_familiar: 1, cedula: String(indice + 1), apellidos: 'Pérez',
      nombres: `Persona ${indice + 1}`, genero: indice < 12 ? 'FEMENINO' : indice < 24 ? 'MASCULINO' : null,
      estudia: false, institucion_estudio: '', trabaja: false, lugar_trabajo: '',
      direccion_domicilio: '', referencia_domicilio: '', vive_con: '', fecha_nacimiento: '2000-01-01',
      elenco: 'PLANTA', lugar_nacimiento: '', celular: '', padece_enfermedad: false,
      detalle_enfermedad: '', correo: '', autorizado_publicacion: false, estado: 'ACTIVO'
    }));
    listar.and.callFake((_filtros: FiltrosBailarines, enlace?: string) => enlace
      ? of({ results: bailarines.slice(15), next: null, previous: '?page=1', count: 25 })
      : of({ results: bailarines.slice(0, 15), next: '?page=2', previous: null, count: 25 }));
    component.cargarBailarines();
    tick();
    fixture.detectChanges();

    expect(listar).toHaveBeenCalledWith({ elenco: 'todos', estado: 'ACTIVO' }, '?page=2');
    expect(component.bailarinesFiltrados.length).toBe(25);
    expect(component.bailarinesPagina.map(b => b.id)).toEqual(bailarines.slice(0, 10).map(b => b.id));
    expect(fixture.nativeElement.querySelectorAll('.dancer-table tbody tr').length).toBe(10);
    const pagina: HTMLElement = fixture.nativeElement.querySelector('.dancers-page');
    const tabla: HTMLElement = fixture.nativeElement.querySelector('.dancer-table-container');
    for (const ancho of [320, 768, 1200, 1440]) {
      fixture.nativeElement.style.display = 'block';
      fixture.nativeElement.style.width = `${ancho}px`;
      fixture.detectChanges();
      expect(tabla.scrollWidth).withContext(`tabla a ${ancho}px`).toBeLessThanOrEqual(tabla.clientWidth);
      expect(pagina.scrollWidth).withContext(`listado a ${ancho}px`).toBeLessThanOrEqual(pagina.clientWidth);
    }
    const paginadores = fixture.debugElement.queryAll(By.directive(Paginator)).map(elemento => elemento.componentInstance as Paginator);
    expect(paginadores.length).toBe(2);
    paginadores[0].changePage(1);
    fixture.detectChanges();
    expect(component.primeraFila).toBe(10);
    expect(paginadores[1].first).toBe(10);
    expect(component.bailarinesPagina[0].id).toBe(11);
    paginadores[1].changePage(2);
    fixture.detectChanges();
    expect(paginadores[0].first).toBe(20);
    expect(component.bailarinesPagina.length).toBe(5);

    const dropdown = fixture.debugElement.query(By.css('p-dropdown[inputId="filtro-genero"]')).componentInstance as Dropdown;
    dropdown.onOptionSelect(new Event('click'), component.opcionesFiltroGenero[1]);
    tick();
    fixture.detectChanges();
    expect(component.primeraFila).toBe(0);
    expect(component.bailarinesFiltrados.length).toBe(12);
    expect(component.bailarinesPagina.every(b => b.genero === 'FEMENINO')).toBeTrue();
    expect(paginadores[0].first).toBe(0);
    expect(paginadores[1].first).toBe(0);
    component.busqueda = 'Persona 12';
    fixture.detectChanges();
    expect(component.bailarinesPagina.map(b => b.id)).toEqual([12]);
    component.busqueda = '';
    component.cambiarPagina({ first: 10 });
    fixture.detectChanges();
    expect(component.bailarinesPagina.length).toBe(2);

    dropdown.onOptionSelect(new Event('click'), component.opcionesFiltroGenero[2]);
    tick();
    fixture.detectChanges();
    expect(component.primeraFila).toBe(0);
    expect(component.bailarinesFiltrados.length).toBe(12);
    expect(component.bailarinesPagina.every(b => b.genero === 'MASCULINO')).toBeTrue();

    dropdown.onOptionSelect(new Event('click'), component.opcionesFiltroGenero[0]);
    tick();
    fixture.detectChanges();
    expect(component.bailarinesFiltrados.length).toBe(25);
    expect(component.bailarinesFiltrados.some(b => b.genero === null)).toBeTrue();
    component.cambiarPagina({ first: 20 });
    const busqueda: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
    busqueda.value = 'Persona 25';
    busqueda.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.primeraFila).toBe(0);
    expect(component.bailarinesPagina.map(b => b.id)).toEqual([25]);
    component.busqueda = '';
    component.primeraFila = 20;
    listar.and.returnValue(of(bailarines.slice(0, 20)));
    component.cargarBailarines();
    expect(component.primeraFila).toBe(10);
    expect(component.bailarinesPagina.length).toBe(10);
  }));

  it('cancela consultas anteriores al cambiar de filtro', () => {
    const anterior = new Subject<Bailarin[]>();
    const actual = new Subject<Bailarin[]>();
    listar.and.returnValues(anterior, actual);
    component.cargarBailarines();
    component.filtroEstado = 'INACTIVO';
    component.cambiarFiltros();
    expect(anterior.observed).toBeFalse();
    expect(actual.observed).toBeTrue();
    actual.next([]);
    actual.complete();
    expect(component.cargando).toBeFalse();
  });
});
