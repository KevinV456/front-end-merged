import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.estaLogueado()) return true;

  auth.logout(false); // limpia una sesión vencida sin navegar dos veces
  return router.createUrlTree(['/login']);
};
