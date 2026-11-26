import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { ENDPOINTS } from '../config/api.config';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && req.url !== ENDPOINTS.login) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
