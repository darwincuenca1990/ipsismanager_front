import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  public username?: string;
  public idUsuario?: number; 
  public rol?: string;
  public idRol?: number;
  public nombre?: string;
  public apellido?: string;
  public correo?: string;
  public fechaRegistro? : string;
  public hotel : any; //esta variable se la usa para registrar el hotel seleccionado en los registros diarios
  public fechaSeleccionadaDashboard? : Date; //esta variable se la usa para registrar la fecha seleccionda en el dashboard
  public registroDiarioSeleccionado : any; // variable que se usa para de la lista enviar a editar el registro diario
  public establecimientosAsignados: any[] = [];; // lista de hoteles asignados al perfil
  public listaHuespedesNacionales: any[] = [];
  public listaHuespedesExtranjeros: any[] = []; 
  constructor() {
    this.loadFromStorage();
  }

    private loadFromStorage() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.username = user.username || '';
        this.correo = user.correo || '';
        this.nombre = user.nombre || '';
        this.apellido = user.apellido || '';
        this.rol = user.rol || '';
        this.fechaRegistro = user.fechaRegistro || null;
      } catch (e) {
        console.warn('No se pudo parsear userInfo desde localStorage', e);
      }
    }
}

}