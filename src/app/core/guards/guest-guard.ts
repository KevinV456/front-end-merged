import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/** Solo deja entrar a quien NO tiene sesión. Si ya la tiene, lo manda al inicio. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.estaLogueado() ? router.createUrlTree(['/dashboard']) : true;
};
