import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PrimeNGConfig } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { constants } from '../../../../assets/constants/constants';
import { DashboardService } from '../../services/dashboard.service';
import { CommonsService } from '../../services/commons.service';
import { UserInfoService } from '../../services/user-info.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  parseInt = parseInt;
  constants = constants;
  
  public selectedDate: Date | null = null;
  maxDate: Date = new Date();
  /**Para obtener el resumen de establecimientos */ 
  public establecimientos_resumen: any[] = [];
  totalRegistros = 0;
  paginaActual = 1;
  pageSize = 10;
  todosEstablecimientos: any[] = [];


  es: any;

  constructor(
    private dashboardService: DashboardService,
     private primengConfig: PrimeNGConfig,
     private commonsService : CommonsService,
    private userInfoService : UserInfoService,
   private router: Router) {
  }

  ngOnInit() {
    const limit = new Date();
    debugger;
    limit.setHours(23, 59, 59, 999);
    this.maxDate = limit;    
    if(this.userInfoService.fechaSeleccionadaDashboard === undefined || this.userInfoService.fechaSeleccionadaDashboard === null){
      this.selectedDate = new Date();
      this.cambiarCalendarEspaniol();
     // this.cargarEstablecimiento();
     // this.cargarTodosEstablecimientos();
    } else {
      this.selectedDate = this.userInfoService.fechaSeleccionadaDashboard;
    //  this.onDateChange(this.userInfoService.fechaSeleccionadaDashboard);
    } 

    this.primengConfig.setTranslation({
      firstDayOfWeek: 1,
      dayNames: [
        'domingo',
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
      ],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
      monthNames: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ],
      monthNamesShort: [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic',
      ],
      today: 'Hoy',
      clear: 'Limpiar',
      weekHeader: 'Sm',
      dateFormat: 'dd/mm/yy',
    });
  }

  onEstablecimientoSeleccionado(event: any) {
  if (event) {
    this.establecimientos_resumen = this.todosEstablecimientos.filter(h => h.id === event.id);
  } else {
    this.establecimientos_resumen = [...this.todosEstablecimientos];
  }
}

/*
  cargarEstablecimiento(){
    const fechaFormateada = this.commonsService.formatearFecha(this.selectedDate ?? new Date());
    this.dashboardService.obtenerEstablecimientos(this.paginaActual,fechaFormateada).subscribe(response =>{
      if (response.count > 0) {
          this.establecimientos_resumen = response.results.data;
          this.totalRegistros = response.count;
          this.userInfoService.establecimientosAsignados = this.establecimientos_resumen;
      }
    });    
  }/*

  /**Cambiar el calendario a espaniol */
  cambiarCalendarEspaniol(){
    this.es = {
      firstDayOfWeek: 1,
      dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
      dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
      monthNames: [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ],
      monthNamesShort: [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic"
      ],
      today: 'Hoy',
      clear: 'Limpiar',
      weekHeader: 'Sm'
    };

  }

  /**Cambio de fechas 
  onDateChange(fecha: Date){
    this.userInfoService.fechaSeleccionadaDashboard = fecha;
    const fechaFormateada = this.commonsService.formatearFecha(fecha);
    this.dashboardService.obtenerEstablecimientos(this.paginaActual,fechaFormateada).subscribe(response =>{
      if (response.count > 0) {
          this.establecimientos_resumen = response.results.data;
          // Verifica si al menos un item tiene el mensaje "No hay registros..."
          const hayMensajeSinDatos = this.establecimientos_resumen.some(item =>
            Array.isArray(item.registros) &&
            item.registros.length > 0 &&
            typeof item.registros[0] === 'object' &&
            item.registros[0]?.mensaje === constants.SWAL_MESSAGES.SIN_DATOS_EN_FECHA_SELECCIONADA_DASHBOARD_DETAIL
          );

          if (hayMensajeSinDatos) {
            Swal.fire({
              icon: 'info',
              title: constants.SWAL_MESSAGES.SIN_DATOS_EN_FECHA_SELECCIONADA_DASHBOARD_TITLE,
              text: constants.SWAL_MESSAGES.SIN_DATOS_EN_FECHA_SELECCIONADA_DASHBOARD_DETAIL,
  customClass: {
    popup: 'swal-small-popup',
    title: 'swal-small-title',
    htmlContainer: 'swal-small-html',
    icon: 'swal-small-icon',
    confirmButton: 'swal-small-button'
  }                 
            });
          }
      }
      
    });
    
  this.cargarTodosEstablecimientos();
  }*/
  
}
