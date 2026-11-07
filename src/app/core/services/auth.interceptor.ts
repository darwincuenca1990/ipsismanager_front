import { HttpInterceptorFn } from '@angular/common/http';

/** Adjunta el JWT a las solicitudes protegidas de la API. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (typeof localStorage === 'undefined') {
    return next(request);
  }

  const isAuthRequest = /\/auth\/(login|token\/refresh)\/?(?:\?.*)?$/.test(request.urlWithParams);
  const accessToken = localStorage.getItem('access_token');

  if (isAuthRequest || !accessToken) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` }
  }));
};