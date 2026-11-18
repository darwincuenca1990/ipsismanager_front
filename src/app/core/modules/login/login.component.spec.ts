import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EMPTY } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserInfoService } from '../../../core/services/user-info.service';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'saveToken']);
    authService.login.and.returnValue(EMPTY);
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserInfoService, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('genera operandos de la suma que no superan diez', () => {
    expect(component.primerNumero).toBeGreaterThanOrEqual(1);
    expect(component.primerNumero).toBeLessThanOrEqual(10);
    expect(component.segundoNumero).toBeGreaterThanOrEqual(1);
    expect(component.segundoNumero).toBeLessThanOrEqual(10);
  });

  it('no envía credenciales si la respuesta de la suma es incorrecta', () => {
    component.loginForm.setValue({
      username: 'usuario',
      password: 'clave',
      captchaAnswer: String(component.primerNumero + component.segundoNumero === 2
        ? 3
        : component.primerNumero + component.segundoNumero - 1)
    });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component.loginForm.controls['captchaAnswer'].value).toBe('');
    expect(component.captchaError).toContain('incorrecta');
  });

  it('envía las credenciales cuando la respuesta de la suma es correcta', () => {
    component.loginForm.setValue({
      username: 'usuario',
      password: 'clave',
      captchaAnswer: String(component.primerNumero + component.segundoNumero)
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('usuario', 'clave');
  });
});
