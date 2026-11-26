import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../../core/services/auth';
import { ResumenService } from '../resumen';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, PageHeader],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  auth = inject(Auth);
  private resumen = inject(ResumenService);

  // null = cargando o sin dato disponible (se muestra "—")
  totalNinos = signal<number | null>(null);
  pagosPendientes = signal<number | null>(null);
  sesionesHoy = signal<number | null>(null);
  alquileresHoy = signal<number | null>(null);

  constructor() {
    const esAdmin = this.auth.tieneRol('ADMIN');
    const categoriaId = this.auth.categoriaId();

    this.cargar(this.resumen.ninosActivos(), this.totalNinos);

    // Un entrenador sin categoría asignada no tiene sesiones propias que mostrar
    if (esAdmin) {
      this.cargar(this.resumen.sesionesHoy(null), this.sesionesHoy);
    } else if (categoriaId !== null) {
      this.cargar(this.resumen.sesionesHoy(categoriaId), this.sesionesHoy);
    }

    if (esAdmin) {
      this.cargar(this.resumen.pagosPendientes(), this.pagosPendientes);
      this.cargar(this.resumen.alquileresHoy(), this.alquileresHoy);
    }
  }

  private cargar(consulta: Observable<number>, destino: { set(valor: number | null): void }) {
    consulta.subscribe({
      next: (valor) => destino.set(valor),
      error: () => destino.set(null),
    });
  }
}
