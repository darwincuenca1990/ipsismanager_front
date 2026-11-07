import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CalendarModule } from "primeng/calendar";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { PanelMenuModule } from "primeng/panelmenu";
import { SidebarModule } from "primeng/sidebar";
import { TabViewModule } from "primeng/tabview";
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from "primeng/paginator";
import { PanelModule } from 'primeng/panel';
//import { Column } from 'primeng/column';

export const SHARED_IMPORTS = [
    CardModule, 
    PanelMenuModule,
    PanelModule, 
    ReactiveFormsModule,
    ButtonModule,
    CommonModule,
    PaginatorModule,
    ToastModule,
    CalendarModule,
    FormsModule,
    RouterModule, 
    PanelMenuModule,
    ButtonModule,
    TabViewModule,
    SidebarModule,
    InputTextModule,
    DropdownModule,
    TableModule,
    MessageModule,
    DialogModule,
    MultiSelectModule,
    BreadcrumbModule,
    CheckboxModule
]