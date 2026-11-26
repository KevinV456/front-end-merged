import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { Rol } from '../../core/models/auth';
import { ItemMenu, Sidebar } from '../../shared/components/sidebar/sidebar';
import { Navbar } from '../../shared/components/navbar/navbar';

const MENU: (ItemMenu & { roles: Rol[] })[] = [
  { texto: 'Inicio', ruta: '/dashboard', icono: 'bi-house-door', roles: ['ADMIN', 'ENTRENADOR'] },
  { texto: 'Niños', ruta: '/ninos', icono: 'bi-people', roles: ['ADMIN', 'ENTRENADOR'] },
  {
    texto: 'Asistencia',
    ruta: '/asistencias',
    icono: 'bi-clipboard-check',
    roles: ['ADMIN', 'ENTRENADOR'],
  },
  {
    texto: 'Entrenamientos',
    ruta: '/entrenamientos',
    icono: 'bi-calendar-week',
    roles: ['ADMIN', 'ENTRENADOR'],
  },
  { texto: 'Canchas', ruta: '/canchas', icono: 'bi-pin-map', roles: ['ADMIN', 'ENTRENADOR'] },
  { texto: 'Entrenadores', ruta: '/entrenadores', icono: 'bi-person-badge', roles: ['ADMIN'] },
  { texto: 'Pagos', ruta: '/pagos', icono: 'bi-cash-coin', roles: ['ADMIN'] },
  { texto: 'Alquileres', ruta: '/alquileres', icono: 'bi-calendar2-check', roles: ['ADMIN'] },
  { texto: 'Reportes', ruta: '/reportes', icono: 'bi-bar-chart-line', roles: ['ADMIN'] },
];

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private auth = inject(Auth);
  menuAbierto = signal(false);

  menu = computed(() => {
    const rol = this.auth.rol();
    return rol ? MENU.filter((item) => item.roles.includes(rol)) : [];
  });
}
