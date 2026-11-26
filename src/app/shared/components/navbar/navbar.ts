import { Component, computed, inject, output } from '@angular/core';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  template: `
    <header class="topbar">
      <button class="btn btn-light d-lg-none" (click)="alternar.emit()" aria-label="Abrir menú">
        <i class="bi bi-list fs-5"></i>
      </button>

      <div class="ms-auto d-flex align-items-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <span class="avatar">{{ inicial() }}</span>
          <div class="d-none d-sm-block lh-sm">
            <div class="fw-semibold">{{ auth.usuario() }}</div>
            <small class="text-muted">{{ rolTexto() }}</small>
          </div>
        </div>
        <button class="btn btn-outline-secondary btn-sm" (click)="auth.logout()">
          <i class="bi bi-box-arrow-right me-1"></i>Salir
        </button>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1030;
    }
    .topbar {
      display: flex;
      align-items: center;
      background: #fff;
      padding: 0.7rem 1.25rem;
      border-bottom: 1px solid var(--ts-borde);
    }
  `,
})
export class Navbar {
  auth = inject(Auth);
  alternar = output<void>();

  inicial = computed(() => this.auth.usuario().charAt(0).toUpperCase());
  rolTexto = computed(() => {
    const rol = this.auth.rol();
    return rol === 'ADMIN' ? 'Administrador' : rol === 'ENTRENADOR' ? 'Entrenador' : 'Usuario';
  });
}
