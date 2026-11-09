import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DashboardService, useValue: { obtenerResumen: () => of({
          bailarines: {
            totalActivos: 0,
            totalInactivos: 0,
            porElenco: {
              INFANTIL: { activos: 0, inactivos: 0 },
              PLANTA: { activos: 0, inactivos: 0 },
              'MÁSTER': { activos: 0, inactivos: 0 }
            }
          },
          cumpleanosMes: [],
          cumpleanosSemana: []
        }) } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
