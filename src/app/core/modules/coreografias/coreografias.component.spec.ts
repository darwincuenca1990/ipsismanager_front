import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Coreografia, CoreografiasService } from '../../services/coreografias.service';
import { CoreografiasComponent } from './coreografias.component';

describe('CoreografiasComponent', () => {
  let component: CoreografiasComponent;
  let fixture: ComponentFixture<CoreografiasComponent>;
  let service: jasmine.SpyObj<CoreografiasService>;
  const coreografia: Coreografia = {
    id: 1, nombre: 'Danza', region: 'Sierra', descripcion: 'Descripción',
    url_video: 'https://example.com/video'
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('CoreografiasService', ['listar', 'crear', 'actualizar', 'eliminar']);
    service.listar.and.returnValue(of([coreografia]));
    service.crear.and.returnValue(of(coreografia));
    service.actualizar.and.returnValue(of(coreografia));
    service.eliminar.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({
      imports: [CoreografiasComponent],
      providers: [{ provide: CoreografiasService, useValue: service }]
    }).compileComponents();
    fixture = TestBed.createComponent(CoreografiasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra la lista y enlaces de video seguros', () => {
    expect(fixture.nativeElement.textContent).toContain('Danza');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(coreografia.url_video);
    expect(component.tieneVideoValido('javascript:alert(1)')).toBeFalse();
  });

  it('valida campos requeridos, longitudes y URL antes de guardar', () => {
    component.nuevo();
    component.form.setValue({ nombre: ' ', region: 'Sierra', descripcion: 'Texto', url_video: 'javascript:alert(1)' });
    component.guardar();
    expect(component.form.controls.nombre.invalid).toBeTrue();
    expect(component.form.controls.url_video.invalid).toBeTrue();
    expect(service.crear).not.toHaveBeenCalled();
    component.form.controls.nombre.setValue('a'.repeat(151));
    expect(component.form.controls.nombre.invalid).toBeTrue();
    component.form.controls.url_video.setValue('https://example.com/' + 'a'.repeat(500));
    expect(component.form.controls.url_video.invalid).toBeTrue();
  });

  it('crea y actualiza enviando los cuatro campos', () => {
    spyOn(Swal, 'fire').and.stub();
    component.nuevo();
    component.form.setValue({ nombre: ' Danza ', region: ' Sierra ', descripcion: ' Texto ', url_video: ' https://example.com/video ' });
    component.guardar();
    expect(service.crear).toHaveBeenCalledWith({
      nombre: 'Danza', region: 'Sierra', descripcion: 'Texto', url_video: 'https://example.com/video'
    });
    component.editar(coreografia);
    expect(component.form.getRawValue()).toEqual({
      nombre: coreografia.nombre, region: coreografia.region,
      descripcion: coreografia.descripcion, url_video: coreografia.url_video
    });
    component.form.controls.region.setValue('Costa');
    component.guardar();
    expect(service.actualizar).toHaveBeenCalledWith(1, {
      nombre: 'Danza', region: 'Costa', descripcion: 'Descripción', url_video: 'https://example.com/video'
    });
  });

  it('mantiene el formulario abierto y muestra errores del servidor', () => {
    service.crear.and.returnValue(throwError(() => ({ error: { nombre: ['Ya existe.'] } })));
    component.nuevo();
    component.form.setValue({ nombre: 'Danza', region: 'Sierra', descripcion: 'Texto', url_video: 'https://example.com' });
    component.guardar();
    expect(component.mostrarFormulario).toBeTrue();
    expect(component.errorFormulario).toContain('nombre: Ya existe.');
    expect(component.guardando).toBeFalse();
  });

  it('permite recorrer respuestas paginadas', () => {
    service.listar.and.returnValue(of({ count: 2, next: 'http://api/coreografias/?page=2', previous: null, results: [coreografia] }));
    component.cargar();
    expect(component.total).toBe(2);
    component.cargar(component.siguiente || undefined);
    expect(service.listar).toHaveBeenCalledWith('http://api/coreografias/?page=2');
  });

  it('conserva el enlace solicitado cuando falla la carga de una página', () => {
    service.listar.and.returnValue(throwError(() => ({ error: { detail: 'Error al cargar.' } })));
    component.cargar('http://api/coreografias/?page=2');
    expect(component.errorListado).toContain('Error al cargar.');
    expect(component.enlaceSolicitado).toBe('http://api/coreografias/?page=2');
    expect(component.cargando).toBeFalse();
  });

  it('elimina solo tras confirmar y vuelve a la página anterior si queda vacía', async () => {
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
    component.anterior = 'http://api/coreografias/?page=1';
    await component.eliminar(coreografia);
    expect(service.eliminar).toHaveBeenCalledWith(1);
    expect(service.listar).toHaveBeenCalledWith('http://api/coreografias/?page=1');
  });

  it('no elimina si se cancela la confirmación', async () => {
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false, isDenied: false, isDismissed: true });
    await component.eliminar(coreografia);
    expect(service.eliminar).not.toHaveBeenCalled();
  });
});
