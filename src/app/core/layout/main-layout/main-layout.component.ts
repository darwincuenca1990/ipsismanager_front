import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ToastModule } from 'primeng/toast';

import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserInfoService } from '../../services/user-info.service';
import { constants } from '../../../../assets/constants/constants';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, BreadcrumbModule, ToastModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  visibleSidebar: boolean = true;
  activeMenuItem: any = null;
  currentYear: number = new Date().getFullYear();

  breadcrumbItems: MenuItem[] = [];
  public userName = 'Darwin Cuenca';
  public userRole = '';
  currentRoute = '';
  menuItems: MenuItem[] = [];
  menuSearchText = '';
  allMenuItemsCopy: MenuItem[] = [];
    

  constructor(
    private router: Router,
    private authService: AuthService,
     private activatedRoute: ActivatedRoute,
    private userInfoService: UserInfoService
  ) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    if(this.userRole === constants.ROL.DIRECCION){
      this.updateMenuItems();
    } 
    
    if(this.userRole === constants.ROL.ADMINISTRADOR){
      this.updateMenuItemsAdmin();
    } 
    });
  }

 

  ngOnInit() {
    debugger;
    this.currentRoute = this.router.url;

    this.userName = `${this.userInfoService.nombre ?? ''} ${this.userInfoService.apellido ?? ''}`;
    this.userRole = this.userInfoService.rol?.trim()
      ? this.userInfoService.rol
      : constants.ROL.DIRECCION; // Valor por defecto si no se encuentra el rol


    this.userName = (this.userInfoService.nombre === undefined || this.userInfoService.nombre === '') &&  (this.userInfoService.apellido === undefined || this.userInfoService.apellido === '' ) 
                  ? this.userInfoService.nombre ?? '' 
                  : `${this.userInfoService.nombre ?? ''} ${this.userInfoService.apellido ?? ''}`  ;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumbItems = this.buildBreadcrumb(this.activatedRoute.root);
    });

    if(this.userRole === constants.ROL.DIRECCION){
      this.updateMenuItems();
    } 
    
    if(this.userRole === constants.ROL.ADMINISTRADOR){
      this.updateMenuItemsAdmin();
    }     
    //this.authService.notifySessionExpirySoon();
  }

  /**Crea el menu para saber donde nos encontramos */
  private buildBreadcrumb(route: ActivatedRoute, url: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) return breadcrumbs;

    for (let child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL) {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, routerLink: url });
        const tabs = child.snapshot.data['breadcrumbTabs'] as Record<string, string> | undefined;
        if (tabs) {
          const tab = child.snapshot.queryParamMap.get('tab') ?? child.snapshot.data['breadcrumbDefaultTab'];
          if (tab && tabs[tab]) breadcrumbs.push({ label: tabs[tab] });
        }
          const parent = child.snapshot.data['breadcrumbParent'];
  if (parent) {
    // Insertar antes del último breadcrumb
    breadcrumbs.splice(breadcrumbs.length - 1, 0, parent);
  }
      }

      return this.buildBreadcrumb(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  /**Lista de menús para direccion */
  updateMenuItems() {
    this.allMenuItemsCopy  = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/dashboard',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Bailarines',
        
        icon: 'pi pi-address-book',
        routerLink: '/bailarines',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Cumpleaños',
        icon: 'pi pi-facebook',
        routerLink: '/cumpleanos',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Presentaciones',
        icon: 'pi pi-book',
        routerLink: '/presentaciones',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Coreografías',
        icon: 'pi pi-video',
        routerLink: '/coreografias',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Ipsis Boot',
        icon: 'pi pi-android',
        //routerLink: '/misRegistros',
        routerLinkActiveOptions: { exact: true }
      }            
    ];
    this.menuItems = [...this.allMenuItemsCopy]
  }

    /**Lista de menús para administrador */
  updateMenuItemsAdmin() {
    this.allMenuItemsCopy  = [
          {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/dashboard',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Bailarines',
        icon: 'pi pi-building',
        routerLink: '/bailarines',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Cumpleaños',
        icon: 'pi pi-book',
        routerLink: '/cumpleanos',
        routerLinkActiveOptions: { exact: true }
      },
      {
        label: 'Coreografías',
        icon: 'pi pi-video',
        routerLink: '/coreografias',
        routerLinkActiveOptions: { exact: true }
      }
    ];
    this.menuItems = [...this.allMenuItemsCopy]
  }

  /**toggleSidebar */
  toggleSidebar() {
    this.visibleSidebar = !this.visibleSidebar;
  }

  /** Filtra el menú lateral según el texto ingresado */
  filterMenu() {
    const query = this.menuSearchText.toLowerCase();
    this.menuItems = this.allMenuItemsCopy.filter(item =>
      (item.label ?? '').toLowerCase().includes(query)
    );
  }

/**logout */
  logout(){
    this.authService.logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(constants.DATA_LOCALSTORAGE.USER_INFO);
       localStorage.removeItem(constants.DATA_LOCALSTORAGE.SUMMARY_INDICATORS);

    this.router.navigate(['/login']);    
  }
}
