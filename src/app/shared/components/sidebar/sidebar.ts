import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ItemMenu {
  texto: string;
  ruta: string;
  icono: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.abierto]="abierto()">
      <div class="marca">
        <span class="logo">⚽</span>
        <div>
          <div class="nombre">Team Soccer</div>
          <div class="sub">Academia de Fútbol</div>
        </div>
      </div>

      <nav>
        <div class="grupo">Menú</div>
        @for (item of items(); track item.ruta) {
          <a [routerLink]="item.ruta" routerLinkActive="activo" (click)="navegar.emit()">
            <i class="bi {{ item.icono }}"></i><span>{{ item.texto }}</span>
          </a>
        }
      </nav>

      <div class="pie">Temporada {{ anio }}</div>
    </aside>

    @if (abierto()) {
      <div class="telon" (click)="navegar.emit()"></div>
    }
  `,
  styles: `
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      width: 248px;
      background: var(--ts-900);
      color: #fff;
      display: flex;
      flex-direction: column;
      z-index: 1040;
      transition: transform 0.25s ease;
    }
    .marca {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.25rem 1rem;
    }
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid var(--ts-lima);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .nombre {
      font-weight: 700;
      line-height: 1.1;
    }
    .sub {
      font-size: 0.75rem;
      opacity: 0.65;
    }
    nav {
      padding: 0.5rem 0.75rem;
      flex: 1;
    }
    .grupo {
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.45;
      padding: 0.75rem 0.5rem 0.4rem;
    }
    a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 0.15rem;
      border-left: 3px solid transparent;
    }
    a i {
      font-size: 1.1rem;
    }
    a:hover {
      background: rgba(255, 255, 255, 0.07);
      color: #fff;
    }
    a.activo {
      background: rgba(198, 239, 61, 0.12);
      color: #fff;
      border-left-color: var(--ts-lima);
      font-weight: 600;
    }
    .pie {
      padding: 1rem 1.25rem;
      font-size: 0.75rem;
      opacity: 0.45;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .telon {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 1035;
    }
    @media (min-width: 992px) {
      .telon {
        display: none;
      }
    }
    @media (max-width: 991.98px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.abierto {
        transform: none;
      }
    }
  `,
})
export class Sidebar {
  items = input.required<ItemMenu[]>();
  abierto = input(false);
  navegar = output<void>();
  anio = new Date().getFullYear();
}
