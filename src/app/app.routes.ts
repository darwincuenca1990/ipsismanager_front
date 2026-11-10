import { Routes } from '@angular/router';
import { LoginComponent } from './core/modules/login/login.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { AuthGuard } from './core/services/auth.guard';
import { DashboardComponent } from './core/modules/dashboard/dashboard.component';
import { BailarinesComponent } from './core/modules/bailarines/bailarines.component';
import { CumpleanosComponent } from './core/modules/cumpleanos/cumpleanos.component';
import { PresentacionesComponent } from './core/modules/presentaciones/presentaciones.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: { breadcrumb: 'Home' },
                canActivate: [AuthGuard],
            },
            {
            path: 'bailarines',
                component: BailarinesComponent,
                data: { breadcrumb: 'Bailarines' },
                canActivate: [AuthGuard],
            },     
            {
            path: 'cumpleanos',
                component: CumpleanosComponent,
                data: {
                    breadcrumb: 'Cumpleaños',
                    breadcrumbTabs: { afiches: 'Gestión Afiches', plantillas: 'Plantillas', planificacion: 'Planificación Cumpleaños' },
                    breadcrumbDefaultTab: 'afiches'
                },
                canActivate: [AuthGuard],
            },   
            {
            path: 'presentaciones',
                component: PresentacionesComponent,
                data: { breadcrumb: 'Presentaciones' },
                canActivate: [AuthGuard],
            },
        ]
    }
];
