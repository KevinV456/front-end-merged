import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { API_URL, ENDPOINTS } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Auth).token;
  const esLogin = req.url === ENDPOINTS.login;
  if (token && !esLogin && req.url.startsWith(API_URL)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
