import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Bailarin, BailarinFormValue, Genero, GrupoFamiliar } from '../../services/bailarines.service';
import { CommonsService, Elenco } from '../../services/commons.service';

@Component({
  selector: 'app-crear-bailarines',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ProgressSpinnerModule, DropdownModule, MessageModule],
  templateUrl: './crear-bailarines.component.html',
  styleUrl: './crear-bailarines.component.css'
})
export class CrearBailarinesComponent implements OnChanges {
  @Input() bailarin: Bailarin | null = null;
  @Input() guardando = false;
  @Input() errorServidor = '';
  @Output() guardar = new EventEmitter<BailarinFormValue>();
  @Output() cancelar = new EventEmitter<void>();

  enviado = false;
  fotografia: File | null = null;
  fotografiaNombre = '';
  representanteSeleccionado: 'PAPA' | 'MAMA' | 'OTRO' = 'OTRO';
  readonly fechaMinimaIngreso = '2013-05-13';
  readonly fechaMaxima = this.fechaActual();
  readonly opcionesGenero: { label: string; value: Genero }[] = [
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Femenino', value: 'FEMENINO' }
  ];
  readonly opcionesConvivencia = [
    { label: 'Seleccione', value: '' },
    { label: 'Padres', value: 'PADRES' },
    { label: 'Familiares', value: 'FAMILIARES' },
    { label: 'Otros', value: 'OTROS' }
  ];
  readonly opcionesEstado = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' }
  ];
  private opcionesRepresentanteCache: { label: string; value: string; disabled: boolean }[] = [];
  private disponibilidadRepresentante = '';

  readonly limites = {
    cedula: 15,
    apellidos: 120,
    nombres: 120,
    lugar_nacimiento: 100,
    celular: 11,
    correo: 254,
    direccion_domicilio: 150,
    referencia_domicilio: 200,
    institucion_estudio: 150,
    lugar_trabajo: 150,
    detalle_enfermedad: 200,
    apellidos_papa: 150,
    nombres_papa: 150,
    celular_papa: 10,
    lugar_trabajo_papa: 100,
    apellidos_mama: 150,
    nombres_mama: 150,
    celular_mama: 10,
    lugar_trabajo_mama: 100
  };

  readonly form = this.fb.group({
    cedula: ['', [Validators.required, Validators.maxLength(this.limites.cedula)]],
    apellidos: ['', [Validators.required, Validators.maxLength(this.limites.apellidos)]],
    nombres: ['', [Validators.required, Validators.maxLength(this.limites.nombres)]],
    genero: ['' as Genero | '', Validators.required],
    fecha_nacimiento: ['', [
      Validators.required,
      (control: AbstractControl) => typeof control.value === 'string' && control.value > this.fechaMaxima
        ? { fechaNacimientoFutura: true }
        : null
    ]],
    elenco: ['', Validators.required],
    lugar_nacimiento: ['', Validators.maxLength(this.limites.lugar_nacimiento)],
    celular: ['', [Validators.maxLength(this.limites.celular), Validators.pattern(/^\d*$/)]],
    correo: ['', [Validators.email, Validators.maxLength(this.limites.correo)]],
    estudia: [false],
    institucion_estudio: [{ value: '', disabled: true }, Validators.maxLength(this.limites.institucion_estudio)],
    trabaja: [false],
    lugar_trabajo: [{ value: '', disabled: true }, Validators.maxLength(this.limites.lugar_trabajo)],
    direccion_domicilio: ['', Validators.maxLength(this.limites.direccion_domicilio)],
    referencia_domicilio: ['', Validators.maxLength(this.limites.referencia_domicilio)],
    vive_con: [''],
    padece_enfermedad: [false],
    detalle_enfermedad: ['', Validators.maxLength(this.limites.detalle_enfermedad)],
    autorizado_publicacion: [false],
    fecha_autorizacion_publicacion: [this.fechaActual()],
    inscripcion: this.fb.group({
      fecha_ingreso_agrupacion: [this.fechaActual(), [
        Validators.required,
        (control: AbstractControl) => typeof control.value === 'string' && control.value < this.fechaMinimaIngreso
          ? { fechaIngresoMinima: true }
          : null
      ]],
      estado: ['ACTIVO' as 'ACTIVO' | 'INACTIVO', Validators.required],
      motivo_ingreso_agrupacion: [''],
      fecha_salida: ['']
    }),
    grupo_familiar: this.fb.group({
      apellidos_papa: ['', Validators.maxLength(this.limites.apellidos_papa)],
      nombres_papa: ['', Validators.maxLength(this.limites.nombres_papa)],
      celular_papa: ['', [Validators.maxLength(this.limites.celular_papa), Validators.pattern(/^\d*$/)]],
      lugar_trabajo_papa: ['', Validators.maxLength(this.limites.lugar_trabajo_papa)],
      apellidos_mama: ['', Validators.maxLength(this.limites.apellidos_mama)],
      nombres_mama: ['', Validators.maxLength(this.limites.nombres_mama)],
      celular_mama: ['', [Validators.maxLength(this.limites.celular_mama), Validators.pattern(/^\d*$/)]],
      lugar_trabajo_mama: ['', Validators.maxLength(this.limites.lugar_trabajo_mama)],
      nombres_completos_representante: ['', Validators.required],
      lugar_trabajo_representante: [''],
      celular_representante: ['', Validators.required],
      parentesco: ['', Validators.required]
    })
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly commonsService: CommonsService,
    private readonly elemento: ElementRef<HTMLElement>
  ) {
    this.form.controls.estudia.valueChanges.pipe(takeUntilDestroyed()).subscribe(estudia => {
      this.actualizarCampoCondicional(this.form.controls.institucion_estudio, !!estudia);
    });
    this.form.controls.trabaja.valueChanges.pipe(takeUntilDestroyed()).subscribe(trabaja => {
      this.actualizarCampoCondicional(this.form.controls.lugar_trabajo, !!trabaja);
    });
  }

  private actualizarCampoCondicional(control: AbstractControl, habilitado: boolean): void {
    if (habilitado) {
      control.addValidators(Validators.required);
      control.enable({ emitEvent: false });
    } else {
      control.removeValidators(Validators.required);
      control.disable({ emitEvent: false });
    }
  }

  get opcionesElenco(): { value: Elenco; label: string }[] {
    return this.commonsService.opcionesElenco;
  }

  get opcionesRepresentante(): { label: string; value: string; disabled: boolean }[] {
    const grupo = this.form.controls.grupo_familiar.controls;
    const padreDisponible = !!(grupo.apellidos_papa.value || grupo.nombres_papa.value);
    const madreDisponible = !!(grupo.apellidos_mama.value || grupo.nombres_mama.value);
    const disponibilidad = `${padreDisponible}-${madreDisponible}`;
    if (disponibilidad !== this.disponibilidadRepresentante) {
      this.disponibilidadRepresentante = disponibilidad;
      this.opcionesRepresentanteCache = [
        { label: 'Otra persona', value: 'OTRO', disabled: false },
        { label: 'Padre', value: 'PAPA', disabled: !padreDisponible },
        { label: 'Madre', value: 'MAMA', disabled: !madreDisponible }
      ];
    }
    return this.opcionesRepresentanteCache;
  }

  get antiguedadAgrupacion(): string {
    return this.commonsService.calcularAntiguedad(
      this.form.controls.inscripcion.controls.fecha_ingreso_agrupacion.value
    );
  }

  get erroresValidacion(): string[] {
    const campos: { path: string; label: string }[] = [
      { path: 'cedula', label: 'Cédula' }, { path: 'apellidos', label: 'Apellidos' },
      { path: 'nombres', label: 'Nombres' }, { path: 'genero', label: 'Género' },
      { path: 'fecha_nacimiento', label: 'Fecha de nacimiento' }, { path: 'elenco', label: 'Elenco' },
      { path: 'lugar_nacimiento', label: 'Lugar de nacimiento' }, { path: 'celular', label: 'Celular' },
      { path: 'correo', label: 'Correo electrónico' }, { path: 'institucion_estudio', label: 'Institución educativa' },
      { path: 'lugar_trabajo', label: 'Lugar de trabajo' }, { path: 'direccion_domicilio', label: 'Dirección domiciliaria' },
      { path: 'referencia_domicilio', label: 'Referencia domiciliaria' }, { path: 'detalle_enfermedad', label: 'Detalle de enfermedad' },
      { path: 'inscripcion.fecha_ingreso_agrupacion', label: 'Fecha de ingreso a la agrupación' },
      { path: 'inscripcion.estado', label: 'Estado' },
      { path: 'grupo_familiar.apellidos_papa', label: 'Apellidos del padre' },
      { path: 'grupo_familiar.nombres_papa', label: 'Nombres del padre' },
      { path: 'grupo_familiar.celular_papa', label: 'Celular del padre' },
      { path: 'grupo_familiar.lugar_trabajo_papa', label: 'Trabajo del padre' },
      { path: 'grupo_familiar.apellidos_mama', label: 'Apellidos de la madre' },
      { path: 'grupo_familiar.nombres_mama', label: 'Nombres de la madre' },
      { path: 'grupo_familiar.celular_mama', label: 'Celular de la madre' },
      { path: 'grupo_familiar.lugar_trabajo_mama', label: 'Trabajo de la madre' },
      { path: 'grupo_familiar.nombres_completos_representante', label: 'Representante' },
      { path: 'grupo_familiar.celular_representante', label: 'Celular del representante' },
      { path: 'grupo_familiar.parentesco', label: 'Parentesco' }
    ];
    return campos.flatMap(({ path, label }) => {
      const control = this.form.get(path);
      if (!control?.errors) return [];
      if (control.hasError('required')) return [`${label}: campo obligatorio.`];
      if (control.hasError('fechaNacimientoFutura')) return [`${label}: no puede ser posterior a hoy.`];
      if (control.hasError('fechaIngresoMinima')) return [`${label}: no puede ser anterior al 13/05/2013.`];
      if (control.hasError('email')) return [`${label}: formato de correo inválido.`];
      if (control.hasError('pattern')) return [`${label}: solo se permiten números.`];
      if (control.hasError('maxlength')) return [`${label}: supera la longitud permitida.`];
      return [`${label}: valor inválido.`];
    });
  }

  caracteresUsados(controlPath: string): number {
    const value = this.form.get(controlPath)?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  actualizarElencoPorFecha(): void {
    const fechaNacimiento = this.form.controls.fecha_nacimiento.value;
    const elenco = fechaNacimiento ? this.obtenerElencoPorEdad(fechaNacimiento) : null;
    this.form.controls.elenco.setValue(elenco ?? '', { emitEvent: false });
  }

  filtrarSoloNumeros(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, this.limites.celular);
    input.value = soloDigitos;
    this.form.controls.celular.setValue(soloDigitos, { emitEvent: false });
  }

  filtrarCelularFamiliar(event: Event, campo: 'celular_papa' | 'celular_mama'): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, this.limites[campo]);
    input.value = soloDigitos;
    this.form.controls.grupo_familiar.controls[campo].setValue(soloDigitos, { emitEvent: false });
    this.actualizarRepresentanteDesdePadres();
  }

  caracteresGrupoUsados(campo: keyof typeof this.limites): number {
    const value = this.form.controls.grupo_familiar.get(campo)?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bailarin']) {
      this.cargarBailarin();
    }
    if (changes['errorServidor'] && this.errorServidor) this.mostrarErrores();
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fotografia = file;
    this.fotografiaNombre = file?.name ?? '';
  }

  seleccionarRepresentante(value: string): void {
    this.representanteSeleccionado = value === 'PAPA' || value === 'MAMA' ? value : 'OTRO';

    if (this.representanteSeleccionado === 'OTRO') {
      const grupoFamiliar = this.form.controls.grupo_familiar;
      grupoFamiliar.setValue({
        ...grupoFamiliar.getRawValue(),
        nombres_completos_representante: '',
        celular_representante: '',
        lugar_trabajo_representante: '',
        parentesco: ''
      });
      return;
    }

    this.actualizarRepresentanteDesdePadres();
  }

  actualizarRepresentanteDesdePadres(): void {
    if (this.representanteSeleccionado === 'OTRO') return;

    const grupo = this.form.get('grupo_familiar')?.getRawValue();
    const esPapa = this.representanteSeleccionado === 'PAPA';
    const nombres = esPapa ? grupo?.nombres_papa : grupo?.nombres_mama;
    const apellidos = esPapa ? grupo?.apellidos_papa : grupo?.apellidos_mama;
    const celular = esPapa ? grupo?.celular_papa : grupo?.celular_mama;
    const lugarTrabajo = esPapa ? grupo?.lugar_trabajo_papa : grupo?.lugar_trabajo_mama;

    const grupoFamiliar = this.form.controls.grupo_familiar;
    grupoFamiliar.setValue({
      ...grupoFamiliar.getRawValue(),
      nombres_completos_representante: [nombres, apellidos].filter(Boolean).join(' ').trim(),
      celular_representante: celular ?? '',
      lugar_trabajo_representante: lugarTrabajo ?? '',
      parentesco: esPapa ? 'Padre' : 'Madre'
    });
  }

  onSubmit(): void {
    this.enviado = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.mostrarErrores();
      return;
    }

    const value = this.form.getRawValue();
    this.guardar.emit({
      ...value,
      genero: value.genero as Genero,
      vive_con: value.vive_con as BailarinFormValue['vive_con'],
      grupo_familiar: value.grupo_familiar as GrupoFamiliar,
      fotografia: this.fotografia,
      inscripcion: {
        ...value.inscripcion,
        fecha_salida: value.inscripcion.fecha_salida || null
      }
    } as BailarinFormValue);
  }

  private mostrarErrores(): void {
    this.elemento.nativeElement.closest('.form-modal')?.scrollTo({ top: 0 });
  }

  private cargarBailarin(): void {
    this.enviado = false;
    this.fotografia = null;
    this.fotografiaNombre = '';
    if (!this.bailarin) {
      this.representanteSeleccionado = 'OTRO';
      this.form.reset({
        genero: '',
        estudia: false,
        trabaja: false,
        padece_enfermedad: false,
        autorizado_publicacion: false,
        elenco: '',
        vive_con: '',
        fecha_autorizacion_publicacion: this.fechaActual(),
        inscripcion: {
          fecha_ingreso_agrupacion: this.fechaActual(),
          estado: 'ACTIVO',
          motivo_ingreso_agrupacion: '',
          fecha_salida: ''
        }
      });
      return;
    }

    const group = typeof this.bailarin.grupo_familiar === 'object'
      ? this.bailarin.grupo_familiar
      : {} as GrupoFamiliar;
    const inscripcionBackend = this.obtenerInscripcionBackend();

    this.form.patchValue({
      ...this.bailarin,
      genero: this.bailarin.genero ?? '',
      fecha_nacimiento: this.normalizarFecha(this.bailarin.fecha_nacimiento),
      elenco: this.bailarin.elenco ?? this.obtenerElencoPorEdad(this.bailarin.fecha_nacimiento?.slice(0, 10)) ?? '',
      fecha_autorizacion_publicacion: this.normalizarFecha(this.bailarin.fecha_autorizacion_publicacion) || this.fechaActual(),
      inscripcion: {
        estado: 'ACTIVO',
        motivo_ingreso_agrupacion: '',
        ...inscripcionBackend,
        fecha_ingreso_agrupacion: this.normalizarFecha(inscripcionBackend?.fecha_ingreso_agrupacion) || this.fechaActual(),
        fecha_salida: this.normalizarFecha(inscripcionBackend?.fecha_salida)
      },
      grupo_familiar: group
    });

    const grupoFamiliar = this.form.get('grupo_familiar')?.getRawValue();
    const representante = this.normalizar(grupoFamiliar?.nombres_completos_representante);
    if (representante && representante === this.normalizar(this.nombreCompleto(grupoFamiliar?.nombres_papa, grupoFamiliar?.apellidos_papa))) {
      this.representanteSeleccionado = 'PAPA';
    } else if (representante && representante === this.normalizar(this.nombreCompleto(grupoFamiliar?.nombres_mama, grupoFamiliar?.apellidos_mama))) {
      this.representanteSeleccionado = 'MAMA';
    } else {
      this.representanteSeleccionado = 'OTRO';
    }
  }

  private nombreCompleto(nombres?: string, apellidos?: string): string {
    return [nombres, apellidos].filter(Boolean).join(' ').trim();
  }

  private obtenerInscripcionBackend(): Partial<NonNullable<Bailarin['inscripcion']>> | null {
    if (this.bailarin?.inscripcion) {
      return {
        ...this.bailarin.inscripcion,
        fecha_ingreso_agrupacion: this.normalizarFecha(this.bailarin.inscripcion.fecha_ingreso_agrupacion),
        fecha_salida: this.normalizarFecha(this.bailarin.inscripcion.fecha_salida) || null
      };
    }

    const inscripciones = this.bailarin?.inscripciones;
    const inscripcionRelacionada = inscripciones?.length
      ? [...inscripciones].sort((a, b) =>
          (b.fecha_ingreso_agrupacion ?? '').localeCompare(a.fecha_ingreso_agrupacion ?? '')
        )[0]
      : null;

    const fechaIngreso = inscripcionRelacionada?.fecha_ingreso_agrupacion
      || this.bailarin?.fecha_ingreso_agrupacion;
    const estado = inscripcionRelacionada?.estado || this.bailarin?.estado;
    const motivo = inscripcionRelacionada?.motivo_ingreso_agrupacion
      ?? this.bailarin?.motivo_ingreso_agrupacion;
    const fechaSalida = inscripcionRelacionada?.fecha_salida
      ?? this.bailarin?.fecha_salida;

    if (!fechaIngreso && !estado && motivo == null && fechaSalida === undefined) return null;

    return {
      fecha_ingreso_agrupacion: this.normalizarFecha(fechaIngreso),
      estado: estado || 'ACTIVO',
      motivo_ingreso_agrupacion: motivo ?? '',
      fecha_salida: this.normalizarFecha(fechaSalida) || null
    };
  }

  private normalizarFecha(fecha?: string | null): string {
    return fecha?.slice(0, 10) ?? '';
  }

  private normalizar(value?: string): string {
    return (value ?? '').trim().toLocaleLowerCase();
  }

  private obtenerElencoPorEdad(fechaNacimiento?: string | null): Elenco | null {
    if (!fechaNacimiento) return null;
    const [year, month, day] = fechaNacimiento.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    if (
      !year || !month || !day ||
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day ||
      birthDate > new Date()
    ) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
      age--;
    }

    if (age >= 5 && age <= 13) return 'INFANTIL';
    if (age >= 14 && age <= 27) return 'PLANTA';
    if (age > 27) return 'MÁSTER';
    return null;
  }

  private fechaActual(): string {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${hoy.getFullYear()}-${mes}-${dia}`;
  }

}
