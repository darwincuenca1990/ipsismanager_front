import { SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Dropdown } from 'primeng/dropdown';
import { Bailarin, GrupoFamiliar } from '../../services/bailarines.service';

import { CrearBailarinesComponent } from './crear-bailarines.component';

describe('CrearBailarinesComponent', () => {
  let component: CrearBailarinesComponent;
  let fixture: ComponentFixture<CrearBailarinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearBailarinesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrearBailarinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('conserva los valores del formulario al seleccionar las opciones PrimeNG', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const dropdown = (id: string) => fixture.debugElement.query(By.css(`p-dropdown[inputId="${id}"]`)).componentInstance as Dropdown;
    expect(dropdown('bailarin-genero').options?.map(opcion => opcion.value)).toEqual(['MASCULINO', 'FEMENINO']);
    dropdown('bailarin-genero').onOptionSelect(new Event('click'), component.opcionesGenero[1]);
    dropdown('bailarin-elenco').onOptionSelect(new Event('click'), component.opcionesElenco.find(opcion => opcion.value === 'PLANTA'));
    dropdown('bailarin-convivencia').onOptionSelect(new Event('click'), component.opcionesConvivencia[2]);
    dropdown('bailarin-estado').onOptionSelect(new Event('click'), component.opcionesEstado[1]);
    fixture.detectChanges();
    expect(component.form.controls.elenco.value).toBe('PLANTA');
    expect(component.form.controls.genero.value).toBe('FEMENINO');
    expect(component.form.controls.vive_con.value).toBe('FAMILIARES');
    expect(component.form.controls.inscripcion.controls.estado.value).toBe('INACTIVO');
    dropdown('bailarin-convivencia').onOptionSelect(new Event('click'), component.opcionesConvivencia[0]);
    expect(component.form.controls.vive_con.value).toBe('');
  }));

  it('habilita a los padres cuando tienen nombre y copia sus datos al seleccionarlos', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const dropdown = fixture.debugElement.query(By.css('p-dropdown[inputId="bailarin-representante"]')).componentInstance as Dropdown;
    expect(component.opcionesRepresentante[1].disabled).toBeTrue();
    expect(component.opcionesRepresentante[2].disabled).toBeTrue();
    component.form.controls.grupo_familiar.patchValue({
      nombres_papa: 'Vicente', apellidos_papa: 'Cuenca', celular_papa: '0999413201', lugar_trabajo_papa: 'Loja'
    });
    fixture.detectChanges();
    expect(component.opcionesRepresentante[1].disabled).toBeFalse();
    dropdown.onOptionSelect(new Event('click'), component.opcionesRepresentante[1]);
    fixture.detectChanges();
    expect(component.representanteSeleccionado).toBe('PAPA');
    expect(component.form.controls.grupo_familiar.controls.nombres_completos_representante.value).toBe('Vicente Cuenca');
    expect(component.form.controls.grupo_familiar.controls.celular_representante.value).toBe('0999413201');
    dropdown.onOptionSelect(new Event('click'), component.opcionesRepresentante[0]);
    expect(component.form.controls.grupo_familiar.controls.nombres_completos_representante.value).toBe('');
  }));

  it('carga valores existentes y conserva la asignación automática de elenco', fakeAsync(() => {
    const grupo: GrupoFamiliar = {
      apellidos_papa: 'Cuenca', nombres_papa: 'Vicente', celular_papa: '0999413201', lugar_trabajo_papa: 'Loja',
      apellidos_mama: '', nombres_mama: '', celular_mama: '', lugar_trabajo_mama: '',
      nombres_completos_representante: 'Vicente Cuenca', lugar_trabajo_representante: 'Loja',
      celular_representante: '0999413201', parentesco: 'Padre'
    };
    const bailarin: Bailarin = {
      id: 1, grupo_familiar: grupo, cedula: '123', apellidos: 'Cuenca', nombres: 'Ana', genero: 'FEMENINO',
      estudia: true, institucion_estudio: '', trabaja: true, lugar_trabajo: '', direccion_domicilio: '',
      referencia_domicilio: '', vive_con: 'FAMILIARES', fecha_nacimiento: '1990-01-01', elenco: 'PLANTA',
      lugar_nacimiento: '', celular: '', padece_enfermedad: false, detalle_enfermedad: '', correo: '',
      autorizado_publicacion: false, estado: 'INACTIVO', fecha_ingreso_agrupacion: '2020-01-01'
    };
    component.bailarin = bailarin;
    component.ngOnChanges({ bailarin: new SimpleChange(null, bailarin, false) });
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const dropdown = (id: string) => fixture.debugElement.query(By.css(`p-dropdown[inputId="${id}"]`)).componentInstance as Dropdown;
    expect(dropdown('bailarin-elenco').value).toBe('PLANTA');
    expect(dropdown('bailarin-genero').value).toBe('FEMENINO');
    expect(dropdown('bailarin-convivencia').value).toBe('FAMILIARES');
    expect(dropdown('bailarin-estado').value).toBe('INACTIVO');
    expect(dropdown('bailarin-representante').value).toBe('PAPA');
    expect(component.form.controls.institucion_estudio.enabled).toBeTrue();
    expect(component.form.controls.lugar_trabajo.enabled).toBeTrue();
    expect(component.form.controls.institucion_estudio.hasError('required')).toBeTrue();
    expect(component.form.controls.lugar_trabajo.hasError('required')).toBeTrue();
    component.form.controls.fecha_nacimiento.setValue('2000-01-01');
    component.actualizarElencoPorFecha();
    fixture.detectChanges();
    expect(dropdown('bailarin-elenco').value).toBe(component.form.controls.elenco.value);

    component.bailarin = { ...bailarin, estudia: false, trabaja: false, institucion_estudio: 'Escuela', lugar_trabajo: 'Empresa' };
    component.ngOnChanges({ bailarin: new SimpleChange(bailarin, component.bailarin, false) });
    fixture.detectChanges();
    expect(component.form.controls.institucion_estudio.disabled).toBeTrue();
    expect(component.form.controls.lugar_trabajo.disabled).toBeTrue();
    expect(component.form.getRawValue().institucion_estudio).toBe('Escuela');
    expect(component.form.getRawValue().lugar_trabajo).toBe('Empresa');
    component.form.patchValue({ estudia: true, trabaja: true });
    component.bailarin = null;
    component.ngOnChanges({ bailarin: new SimpleChange(bailarin, null, false) });
    expect(component.form.controls.institucion_estudio.disabled).toBeTrue();
    expect(component.form.controls.lugar_trabajo.disabled).toBeTrue();
  }));

  it('exige institución y lugar de trabajo solo cuando están seleccionados', () => {
    const { estudia, trabaja, institucion_estudio, lugar_trabajo } = component.form.controls;
    expect(institucion_estudio.disabled).toBeTrue();
    expect(lugar_trabajo.disabled).toBeTrue();

    const estudioCheckbox: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="estudia"]');
    const trabajoCheckbox: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="trabaja"]');
    const institucionInput: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="institucion_estudio"]');
    const trabajoInput: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="lugar_trabajo"]');
    expect(institucionInput.disabled).toBeTrue();
    expect(trabajoInput.disabled).toBeTrue();
    estudioCheckbox.click();
    fixture.detectChanges();
    expect(institucionInput.disabled).toBeFalse();
    expect(trabajoInput.disabled).toBeTrue();
    trabajoCheckbox.click();
    fixture.detectChanges();
    expect(trabajoInput.disabled).toBeFalse();
    expect(estudia.value).toBeTrue();
    expect(trabaja.value).toBeTrue();
    expect(institucion_estudio.hasError('required')).toBeTrue();
    expect(lugar_trabajo.hasError('required')).toBeTrue();
    component.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.form-errors').textContent).toContain('Institución educativa: campo obligatorio');
    expect(fixture.nativeElement.querySelector('.form-errors').textContent).toContain('Lugar de trabajo: campo obligatorio');
    expect(fixture.nativeElement.querySelector('input[formControlName="institucion_estudio"]').getAttribute('aria-required')).toBe('true');

    institucion_estudio.setValue('Escuela');
    lugar_trabajo.setValue('Empresa');
    expect(institucion_estudio.valid).toBeTrue();
    expect(lugar_trabajo.valid).toBeTrue();
    estudioCheckbox.click();
    trabajoCheckbox.click();
    fixture.detectChanges();
    expect(institucionInput.disabled).toBeTrue();
    expect(trabajoInput.disabled).toBeTrue();
    expect(institucion_estudio.value).toBe('Escuela');
    expect(lugar_trabajo.value).toBe('Empresa');
    expect(fixture.nativeElement.querySelector('.form-errors').textContent).not.toContain('Institución educativa: campo obligatorio');
    expect(fixture.nativeElement.querySelector('.form-errors').textContent).not.toContain('Lugar de trabajo: campo obligatorio');
    expect(fixture.nativeElement.querySelector('input[formControlName="lugar_trabajo"]').getAttribute('aria-required')).toBe('false');

    estudioCheckbox.click();
    trabajoCheckbox.click();
    institucion_estudio.setValue('a'.repeat(component.limites.institucion_estudio + 1));
    lugar_trabajo.setValue('a'.repeat(component.limites.lugar_trabajo + 1));
    expect(institucion_estudio.hasError('maxlength')).toBeTrue();
    expect(lugar_trabajo.hasError('maxlength')).toBeTrue();
  });

  it('impide guardar si faltan los datos condicionales y permite guardar al completarlos', () => {
    component.form.patchValue({
      cedula: '123', apellidos: 'Pérez', nombres: 'Ana', genero: 'FEMENINO',
      fecha_nacimiento: '2000-01-01', elenco: 'PLANTA', estudia: true, trabaja: true,
      grupo_familiar: { nombres_completos_representante: 'Representante', celular_representante: '123', parentesco: 'Otro' }
    });
    spyOn(component.guardar, 'emit');
    component.onSubmit();
    expect(component.guardar.emit).not.toHaveBeenCalled();

    component.form.patchValue({ institucion_estudio: 'Escuela', lugar_trabajo: 'Empresa' });
    component.onSubmit();
    expect(component.guardar.emit).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      estudia: true, institucion_estudio: 'Escuela', trabaja: true, lugar_trabajo: 'Empresa'
    }));

    component.form.patchValue({ estudia: false, trabaja: false });
    component.onSubmit();
    expect(component.guardar.emit).toHaveBeenCalledTimes(2);
    expect(component.guardar.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      estudia: false, institucion_estudio: 'Escuela', trabaja: false, lugar_trabajo: 'Empresa'
    }));
  });

  it('muestra errores de validación en mensajes PrimeNG al inicio del formulario', () => {
    component.form.controls.correo.setValue('correo-invalido');
    component.form.controls.fecha_nacimiento.setValue('9999-12-31');
    component.form.controls.inscripcion.controls.fecha_ingreso_agrupacion.setValue('2010-01-01');
    component.onSubmit();
    fixture.detectChanges();
    const mensajes: HTMLElement = fixture.nativeElement.querySelector('.form-errors');
    expect(mensajes.querySelectorAll('p-message').length).toBeGreaterThan(0);
    expect(mensajes.textContent).toContain('Género: campo obligatorio');
    expect(mensajes.textContent).toContain('Correo electrónico: formato de correo inválido');
    expect(mensajes.textContent).toContain('no puede ser posterior a hoy');
    expect(mensajes.textContent).toContain('no puede ser anterior al 13/05/2013');
    component.form.controls.genero.setValue('FEMENINO');
    component.form.controls.correo.setValue('correo@example.com');
    fixture.detectChanges();
    expect(mensajes.textContent).not.toContain('Género: campo obligatorio');
    expect(mensajes.textContent).not.toContain('Correo electrónico: formato de correo inválido');
  });

  it('presenta el error del servidor sin mostrar errores de validación antes del envío', () => {
    component.errorServidor = 'No se pudo guardar el bailarín.';
    fixture.detectChanges();
    const mensajes: HTMLElement = fixture.nativeElement.querySelector('.form-errors');
    expect(mensajes.querySelectorAll('p-message').length).toBe(1);
    expect(mensajes.textContent).toContain('No se pudo guardar el bailarín.');
  });
});
