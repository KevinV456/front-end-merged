import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CanchaService } from '../cancha';
import { Auth } from '../../../core/services/auth';
import { Cancha, EstadoCancha, nombreCancha } from '../../../core/models/cancha';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado, Tono } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-cancha-list',
  imports: [RouterLink, PageHeader, BadgeEstado, EstadoVacio, Modal],
  templateUrl: './cancha-list.html',
})
export class CanchaList {
  private canchaService = inject(CanchaService);
  auth = inject(Auth);

  readonly nombre = nombreCancha;

  canchas = signal<Cancha[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  porEliminar = signal<Cancha | null>(null);
  eliminando = signal(false);
  errorBaja = signal('');

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');

    this.canchaService.listar().subscribe({
      next: (lista) => {
        this.canchas.set([...lista].sort((a, b) => a.id - b.id));
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'No tienes permiso para ver las canchas (403)'
            : `No se pudo cargar la lista (error ${e.status})`,
        );
      },
    });
  }

  tono(estado: EstadoCancha): Tono {
    return estado === 'DISPONIBLE' ? 'verde' : estado === 'OCUPADA' ? 'azul' : 'rojo';
  }

  texto(estado: EstadoCancha): string {
    return estado === 'DISPONIBLE'
      ? 'Disponible'
      : estado === 'OCUPADA'
        ? 'Ocupada'
        : 'En mantenimiento';
  }

  pedirBaja(cancha: Cancha) {
    this.errorBaja.set('');
    this.porEliminar.set(cancha);
  }

  cancelarBaja() {
    if (!this.eliminando()) this.porEliminar.set(null);
  }

  confirmarBaja() {
    const cancha = this.porEliminar();
    if (!cancha) return;

    this.eliminando.set(true);
    this.errorBaja.set('');

    this.canchaService.eliminar(cancha.id).subscribe({
      next: () => {
        this.canchas.update((lista) => lista.filter((c) => c.id !== cancha.id));
        this.exito.set(`${nombreCancha(cancha.id)} fue dada de baja.`);
        this.eliminando.set(false);
        this.porEliminar.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.errorBaja.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor.'
            : e.status === 403
              ? 'No tienes permiso para dar de baja canchas.'
              : e.status === 404
                ? 'La cancha ya no existe.'
                : e.status === 409
                  ? 'No se puede dar de baja: la cancha tiene entrenamientos o alquileres asociados.'
                  : `No se pudo dar de baja (error ${e.status}).`,
        );
      },
    });
  }
}
