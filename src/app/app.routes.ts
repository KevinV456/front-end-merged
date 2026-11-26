import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { guestGuard } from './core/guards/guest-guard';

import { Login } from './features/auth/login/login';
import { Saludo } from './features/publico/saludo/saludo';
import { MainLayout } from './layouts/main-layout/main-layout';
import { FormLayout } from './layouts/form-layout/form-layout';
import { Dashboard } from './features/dashboard/dashboard/dashboard';

import { NinoList } from './features/ninos/nino-list/nino-list';
import { NinoForm } from './features/ninos/nino-form/nino-form';
import { AsistenciaRegistro } from './features/asistencias/asistencia-registro/asistencia-registro';

import { EntrenadorList } from './features/entrenadores/entrenador-list/entrenador-list';
import { EntrenadorForm } from './features/entrenadores/entrenador-form/entrenador-form';
import { EntrenamientoList } from './features/entrenamientos/entrenamiento-list/entrenamiento-list';
import { EntrenamientoForm } from './features/entrenamientos/entrenamiento-form/entrenamiento-form';
import { PagoList } from './features/pagos/pago-list/pago-list';
import { PagoForm } from './features/pagos/pago-form/pago-form';
import { CanchaList } from './features/canchas/cancha-list/cancha-list';
import { CanchaForm } from './features/canchas/cancha-form/cancha-form';
import { AlquilerList } from './features/alquileres/alquiler-list/alquiler-list';
import { AlquilerForm } from './features/alquileres/alquiler-form/alquiler-form';
import { Reportes } from './features/reportes/reportes/reportes';

const AMBOS = { roles: ['ADMIN', 'ENTRENADOR'] };
const SOLO_ADMIN = { roles: ['ADMIN'] };

export const routes: Routes = [
  // ---------- Públicas ----------
    { path: 'publico', component: Saludo },
  { path: 'login', component: Login, canActivate: [guestGuard] },

  // ---------- Formularios: vista enfocada (solo ADMIN) ----------
  {
    path: '',
    component: FormLayout,
    canActivate: [authGuard, roleGuard],
    data: SOLO_ADMIN,
    children: [
      { path: 'ninos/nuevo', component: NinoForm },
      { path: 'ninos/:id/editar', component: NinoForm },

      { path: 'entrenadores/nuevo', component: EntrenadorForm },
      { path: 'entrenadores/:id/editar', component: EntrenadorForm },

      { path: 'entrenamientos/nuevo', component: EntrenamientoForm },
      { path: 'entrenamientos/:id/editar', component: EntrenamientoForm },

      { path: 'pagos/nuevo', component: PagoForm },

      { path: 'canchas/nuevo', component: CanchaForm },
      { path: 'canchas/:id/editar', component: CanchaForm },

      { path: 'alquileres/nuevo', component: AlquilerForm },
      { path: 'alquileres/:id/editar', component: AlquilerForm },
    ],
  },

  // ---------- Aplicación con menú lateral ----------
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },

      // ADMIN y ENTRENADOR
      { path: 'ninos', component: NinoList, canActivate: [roleGuard], data: AMBOS },
      { path: 'asistencias', component: AsistenciaRegistro, canActivate: [roleGuard], data: AMBOS },
      {
        path: 'entrenamientos',
        component: EntrenamientoList,
        canActivate: [roleGuard],
        data: AMBOS,
      },
      { path: 'canchas', component: CanchaList, canActivate: [roleGuard], data: AMBOS },

      // Solo ADMIN
      {
        path: 'entrenadores',
        component: EntrenadorList,
        canActivate: [roleGuard],
        data: SOLO_ADMIN,
      },
      { path: 'pagos', component: PagoList, canActivate: [roleGuard], data: SOLO_ADMIN },
      { path: 'alquileres', component: AlquilerList, canActivate: [roleGuard], data: SOLO_ADMIN },
      { path: 'reportes', component: Reportes, canActivate: [roleGuard], data: SOLO_ADMIN },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: '' },
];
