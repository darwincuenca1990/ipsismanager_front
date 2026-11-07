import { environment } from "../../environments/environment";

export const constants = {
    VERSION : '1.0.0-SNAPSHOT',
    SERVICES : {
        INDICADOR_ALOJAMIENTO_WS : {
            CONTEXT: environment.apiBaseUrl,
            AUTH : {
                PATH : '/auth',
                CONTROLLERS : {
                    LOGIN : '/login/',
                    TOKEN : '/token',
                    REFRESH : {
                        REFRESH: '/refresh/'
                    }
                }
            },
            /*USERS : {
                PATH : '/users',
                CONTROLLERS : {
                    //GET_ESTABLISHMENTS : '/establecimientos'
                }
            },*/
            ESTABLECIMIENTOS : {
                PATH: '/establecimientos',
                CONTROLLERS :{
                    GET_ESTABLISHMENTS : '/lista_establecimientos',
                    GET_REGISTES_BY_ESTABLISHMENTS : '/registros',
                    GET_DATA_ANALYTIC : '/analytics/',
                    SAVE_DAILY_REGISTERS : '/registros',
                    SAVE_DAILY_GUEST: '/huespedes/',
                    GET_COMPETITORS: '/comparar',
                    GET_CANDIDATE: '/candidatos'
                }
            },
            UBICACION : {
                PATH: '/ubicacion',
                CONTROLLERS :{
                    GET_ALL_CANTON : '/canton'
                }
            },            
            ITEMS :{
                PATH : '/catalogos',
                CONTROLLERS : {
                    GET_CATALOGS : '/catalogo/',
                    GET_ITEMS : '/items/'
                }
            },
            ADMINISTRACION : {
                USUARIOS :{
                    PATH: '/users',
                    CONTROLLERS :{
                        GET_ALL_USERS : '/user',
                        SAVE_USER : '',
                        UPDATE_USER : '',
                        DELETE_USER : ''
                    }
                },
                ROLES :{
                    PATH: '/rols',
                    CONTROLLERS :{
                        GET_ALL_ROLS : '/rol',
                        SAVE_ROL : '',
                        UPDATE_ROL : '',
                        DELETE_ROL : ''
                    }
                },
                PROVINCIAS :{
                    PATH: '/ubicacion',
                    CONTROLLERS :{
                        GET_ALL_PROVINCE : '/provincia',
                        SAVE_RECORD : '/provincia/',
                    }
                },
                PARROQUIA : {
                    CONTROLLERS: {
                        GET_ALL_PARROQUIA : '/parroquia'
                    }
                }                          
            },             
        }
    },
    MESSAGES :{
        VENTA_NETA_DIARIA: "VENTA NETA DIARIA",
        VENTA_NETA: "VENTA NETA",
        REVPAR: "REVPAR",
        TARIFA_PROMEDIO: "Tarifa Promedio",
        OCUPACION_GENERAL_DIMINUTIVO: "% Ocupación",
        VS_DIA_ANIO_ANTERIOR : "VS mismo día del año anterior",
        VS_MES_ANIO_ANTERIOR : "VS mismo mes del año anterior",
        VS_ANIO_ANTERIOR : "VS año anterior",
        ESTADIA_PROMEDIO : "Estadía promedio",
        OCUPACION_GENERAL: "% Tasa de ocupación general",
        HABITACIONES_DISPONIBLES: "Habitaciones disponibles",
        HABITACIONES_OCUPADAS: "Habitaciones Ocupadas",
        CHECKINS: "Checkins",
        CHECKOUTS: "Checkouts",
        TITLE_DIARY: "Diario",
        TITLE_MONTHLY: "Mensual",
        TITLE_ANNUAL: "Anual"
    },
    SWAL_MESSAGES : {
        SIN_DATOS_EN_FECHA_SELECCIONADA_DASHBOARD_TITLE : 'No se encuentra registros',
        SIN_DATOS_EN_FECHA_SELECCIONADA_DASHBOARD_DETAIL : 'No existen registros para la fecha especificada',
        SESSION_EXPIRAR_TITLE : 'Sesión a punto de expirar',
        SESSION_EXPIRAR_DETAIL : 'Tu sesión está a punto de caducar. ¿Deseas renovarla?',
        SESSION_RENOVADA : 'Sesión renovada',
        SESSION_EXTENDIDA : 'Tu sesión fue extendida.',
        SESSION_NO_RENOVAR_SESION : 'No se pudo renovar la sesión.',
        SESSION_NO_ENCONTRO_TOKEN_SESION : 'No se encontró el token de renovación.',
        DATA_INCOMPLETE_POPUP_HUSPEDES : 'Por favor, completa todos los campos antes de agregar.',
        WHITHOUT_DATA_SAME_DAYE_LAST_YEAR : 'Sin resultados del mismo día de año anterior.',
        WHITOUTH_DATA_PARAMS_SELECTED : 'No se encontraron datos para los parámetros seleccionados.',
        END_DATE_MAYOR_START_DATE : 'La fecha de fin debe ser mayor que la fecha de inicio.',
        RECORD_SAVED_SUCCESFULL : 'El registro se ha guardado correctamente',
        RECORD_UPDATE_SUCCESFULL : 'El registro se ha actualizado correctamente',
        RECORD_DELETE_SUCCESFULL : 'El registro se ha eliminado correctamente',
        RECORD_SAVED_TITTLE : 'Registro guardado',
        RECORD_UPDATE_TITTLE : 'Registro actualizado',
        RECORD_DELETE_TITTLE : 'Registro eliminado',        

    },
    SYSTEM_VALUES : {
        ANIO_START_TO_COUNT : 2020,
        DAYS_TO_SUM_FROM_ENDDATE_INDICADORES_TIEMPO: 30
    },
    ROL : {
        DIRECCION : "Dirección",
        ADMINISTRADOR : "Administrador"
    },
    ITEMS : {
        DAYS_TO_SUM_START_DATE : 5,
        COUNTRYS : 6, //paises
        REASON_GUEST: 7, //motivo visita
        FEE_TYPE: 4, //tipo de tarifa
        NATIONAL_GUEST: 33, //huéspedes nacionales
        INTERNATIONAL_GUEST: 34 //huéspedes extranjeros
    },
    METRICS_TO_GRAPHIC : {
        VENTAS_NETAS : 'ventas_netas',
        REVPAR : 'revpar',
        TARIFA_PROMEDIO : 'tarifa_promedio',
        PORCENTAJE_OCUPACION : 'porcentaje_ocupacion',
        PORCENTAJE_OCUPACION_OPERATIVA : 'porcentaje_ocupacion_operativa',
        PORCENTAJE_OCUPACION_POTENCIAL : 'porcentaje_ocupacion_potencial',
        NACIONALIDAD : 'nacionalidad',
        PERNOCTACIONES : 'pernoctaciones',
        ESTANCIA_MEDIA : 'estancia_media',
        CKECKINS : 'checkins',
        CHECKOUTS : 'checkouts',
        INGRESO_POR_HUESPED : 'ingreso_por_huesped'
    },
    DATA_LOCALSTORAGE : {
        SUMMARY_INDICATORS : 'indicadoresResumen',
        USER_INFO: 'userInfo'
    },
    COMPARATIVES: {
        BASE_STABLISHMENT: 'id_establecimiento_base',
        LOCATION_LEVEL: 'nivel_ubicacion'
    },
    REPORTS:{
        SUFFIX_DIARY: 'diario',
        SUFFIX_MONTHLY: 'mensual',
        SUFFIX_ANNUALLY: 'anual',
        DATE_SELECTED: 'Fecha Seleccionada',
        PERIOD: 'Período',
        YEAR_SELECTED: 'Año Seleccionado',
        LEVEL_LOCATION_SELECTED:'Nivel Ubicación Seleccionado',
        SWAL_TITLE_WITHOUT_DATE_SELECTED: 'No existen fechas seleccionadas',
        SWAL_DETAIL_WITHOUT_DATE_SELECTED: 'Se necesita tener seleccionado Fecha Desde y Hasta para poder generar el reporte Mensual.',
        SWAL_TITLE_WITHOUT_VARIABLE_EXPLORER: 'Se necesita variable de exploración',
        SWAL_DETAIL_WITHOUT_VARIABLE_SELECTED: 'Se necesita al menos tener una variable de exploración seleccionada para generar el reporte.'
    
    }

}