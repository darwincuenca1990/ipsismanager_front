import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('habilita las animaciones necesarias para los paneles de PrimeNG', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(ANIMATION_MODULE_TYPE)).toBe('BrowserAnimations');
  });
});
