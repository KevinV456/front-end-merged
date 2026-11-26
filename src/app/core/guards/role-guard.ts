import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { Rol } from '../models/auth';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as Rol[];
  return roles.length === 0 || auth.tieneRol(...roles)
    ? true
    : router.createUrlTree(['/dashboard']);
};