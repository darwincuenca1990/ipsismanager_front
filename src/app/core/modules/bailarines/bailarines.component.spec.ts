import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Dropdown } from 'primeng/dropdown';
import { of } from 'rxjs';
import { BailarinesService } from '../../services/bailarines.service';
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
});
