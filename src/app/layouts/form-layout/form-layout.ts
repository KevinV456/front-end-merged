import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-form-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="barra">
      <div class="marca">
        <span class="logo">⚽</span>
        <span class="fw-bold">Team Soccer</span>
      </div>
      <a routerLink="/ninos" class="btn btn-outline-light btn-sm">
        <i class="bi bi-x-lg me-1"></i>Cerrar
      </a>
    </header>

    <main class="p-3 p-md-4">
      <div class="contenedor">
        <router-outlet />
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
    .barra {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--ts-900);
      color: #fff;
      padding: 0.75rem 1.25rem;
    }
    .marca {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .logo {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 2px solid var(--ts-lima);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .contenedor {
      max-width: 860px;
      margin: 0 auto;
    }
  `,
})
export class FormLayout {}
