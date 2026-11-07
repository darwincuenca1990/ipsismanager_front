import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { constants } from '../../../assets/constants/constants';
import { DecodedToken } from '../models/DecodedToken';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private sessionWarningHandle?: ReturnType<typeof setTimeout>;
  private sessionExpiryHandle?: ReturnType<typeof setTimeout>;
  private countdownInterval?: ReturnType<typeof setInterval>;
  private lastActivityAt = Date.now();
  private readonly inactivityThresholdMs = 60_000;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.attachUserActivityListeners();
    if (typeof localStorage !== 'undefined' && this.getToken()) {
      this.startSessionTimer();
    }
  }

  login(username: string, password: string): Observable<any> {
    const loginUrl = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.AUTH.PATH}${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.AUTH.CONTROLLERS.LOGIN}`;
    return this.http.post<any>(loginUrl, { username, password });
  }

  saveToken(token: string, refreshToken: string, expiresIn: number | string): void {
    this.setTokens(token, refreshToken, expiresIn);
  }

  private setTokens(token: string, refreshToken: string, expiresIn: number | string): void {
    if (typeof localStorage === 'undefined') return;

    const expiresAt = this.getExpirationTimestamp(token, expiresIn);
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', String(expiresAt));
    this.startSessionTimer();
  }

  updateAccessToken(newAccessToken: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('access_token', newAccessToken);
    const decoded: DecodedToken = jwtDecode(newAccessToken);
    localStorage.setItem('expires_at', String(decoded.exp));
    this.startSessionTimer();
  }

  getToken(): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem('refresh_token');
  }

  refreshToken(refresh: string): Observable<any> {
    const refreshUrl = `${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.AUTH.PATH}${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.AUTH.CONTROLLERS.TOKEN}${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.AUTH.CONTROLLERS.REFRESH.REFRESH}`;
    return this.http.post<any>(refreshUrl, { refresh }).pipe(
      tap((res: any) => {
        const decoded: DecodedToken = jwtDecode(res.access);
        this.setTokens(res.access, res.refresh ?? refresh, decoded.exp);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.clearSessionTimers();
    Swal.close();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem(constants.DATA_LOCALSTORAGE.USER_INFO);
      localStorage.removeItem(constants.DATA_LOCALSTORAGE.SUMMARY_INDICATORS);
    }
    this.router.navigate(['/login']);
  }

  /** Programa el aviso a 60 segundos de expirar y el cierre en el instante de expiración. */
  startSessionTimer(): void {
    this.clearSessionTimers();
    if (typeof localStorage === 'undefined') return;

    const expiresAt = Number(localStorage.getItem('expires_at'));
    if (!Number.isFinite(expiresAt) || expiresAt <= 0) return;

    const millisecondsToExpire = expiresAt * 1000 - Date.now();
    if (millisecondsToExpire <= 0) {
      this.logout();
      return;
    }

    const warningDelay = Math.max(0, millisecondsToExpire - 60_000);
    this.sessionWarningHandle = setTimeout(() => {
      if (this.isUserInactive()) {
        this.notifySessionExpirySoon();
        return;
      }

      this.startSessionTimer();
    }, warningDelay);
    this.sessionExpiryHandle = setTimeout(() => this.logout(), millisecondsToExpire);
  }

  /** Aviso modal con cuenta regresiva; solo aparece si el usuario está inactivo. */
  notifySessionExpirySoon(): void {
    if (!this.isUserInactive()) {
      this.startSessionTimer();
      return;
    }

    let remainingSeconds = 60;

    Swal.fire({
      title: constants.SWAL_MESSAGES.SESSION_EXPIRAR_TITLE,
      html: `${constants.SWAL_MESSAGES.SESSION_EXPIRAR_DETAIL}<br><strong>La sesión se cerrará en <span id="session-countdown">60</span> segundos.</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Renovar sesión',
      cancelButtonText: 'Cerrar sesión',
      reverseButtons: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: 60_000,
      timerProgressBar: true,
      didOpen: () => {
        const countdown = Swal.getHtmlContainer()?.querySelector('#session-countdown');
        this.countdownInterval = setInterval(() => {
          remainingSeconds = Math.max(0, remainingSeconds - 1);
          if (countdown) countdown.textContent = String(remainingSeconds);
        }, 1_000);
      },
      willClose: () => {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = undefined;
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.renovarSesion();
      } else {
        this.logout();
      }
    });
  }

  private renovarSesion(): void {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      this.logout();
      return;
    }

    this.refreshToken(refresh).subscribe({
      next: () => {
        this.lastActivityAt = Date.now();
        this.startSessionTimer();
      },
      error: () => this.logout()
    });
  }

  private getExpirationTimestamp(token: string, expiresIn: number | string): number {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      if (decoded.exp) return decoded.exp;
    } catch {
      // Si no se puede decodificar el JWT, se usa expires_in como respaldo.
    }

    const value = Number(expiresIn);
    if (!Number.isFinite(value) || value <= 0) return 0;
    const now = Math.floor(Date.now() / 1000);
    return value > now ? value : now + value;
  }

  private clearSessionTimers(): void {
    if (this.sessionWarningHandle) clearTimeout(this.sessionWarningHandle);
    if (this.sessionExpiryHandle) clearTimeout(this.sessionExpiryHandle);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.sessionWarningHandle = undefined;
    this.sessionExpiryHandle = undefined;
    this.countdownInterval = undefined;
  }

  private attachUserActivityListeners(): void {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];
    events.forEach(eventName => {
      document.addEventListener(eventName, () => {
        this.lastActivityAt = Date.now();
      }, { passive: true });
    });
  }

  private isUserInactive(): boolean {
    return Date.now() - this.lastActivityAt >= this.inactivityThresholdMs;
  }
}
