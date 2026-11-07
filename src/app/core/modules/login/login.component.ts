import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import { UserInfoService } from '../../../core/services/user-info.service';
import { constants } from '../../../../assets/constants/constants';
import { PasswordModule } from 'primeng/password';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [...SHARED_IMPORTS, PasswordModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  rememberUser = false;
  loginForm: FormGroup;
  submitted = false;




  constructor(private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userInfoService: UserInfoService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe({
        next: res => {
          this.authService.saveToken(res.data.access, res.data.refresh, res.data.expires_in.toString()); // si es JWT: res.access
          this.setInfoUser(res);
          this.router.navigate(['/dashboard']);
        },
        error: err => {
          console.error('Login failed', err);
          Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: 'Usuario o contraseña incorrectos o el usuario está inactivo',
            confirmButtonColor: '#d33'
          });
          console.error('Login failed', err);
        }
      });
      // this.router.navigate(['/dashboard']);
    }
  }

  /**Setea la informacion del usuario */
  setInfoUser(res: any) {
    const user = {
      username: res.data.user.username,
      correo: res.data.user.email,
      nombre: res.data.user.first_name,
      apellido: res.data.user.last_name,
      rol: res.data.user.groups?.length ? res.data.user.groups[0] : '',
      fechaRegistro: res.data.user.date_joined,
    };

    // Guarda en el servicio (memoria)
    this.userInfoService.username = user.username;
    this.userInfoService.correo = user.correo;
    this.userInfoService.nombre = user.nombre;
    this.userInfoService.apellido = user.apellido;
    this.userInfoService.rol = user.rol;
    this.userInfoService.fechaRegistro = user.fechaRegistro;

    localStorage.setItem('accessToken', res.data.access);
    localStorage.setItem('refreshToken', res.data.refresh);

    localStorage.setItem(constants.DATA_LOCALSTORAGE.USER_INFO, JSON.stringify(user));
  }

}
