import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { EntrenadorService } from '../entrenador';
import { Entrenador } from '../../../core/models/entrenador';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-entrenador-list',
  imports: [RouterLink, PageHeader, BadgeEstado, EstadoVacio, Modal],
  templateUrl: './entrenador-list.html',
})
export class EntrenadorList {
  private servicio = inject(EntrenadorService);

  entrenadores = signal<Entrenador[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  porDesactivar = signal<Entrenador | null>(null);
  desactivando = signal(false);
  errorBaja = signal('');

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.entrenadores.set(lista);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'No tienes permiso para ver esta información (403)'
            : `No se pudo cargar la lista (error ${e.status})`,
        );
      },
    });
  }

  pedirBaja(entrenador: Entrenador) {
    this.errorBaja.set('');
    this.porDesactivar.set(entrenador);
  }

  cancelarBaja() {
    if (!this.desactivando()) this.porDesactivar.set(null);
  }

  confirmarBaja() {
    const entrenador = this.porDesactivar();
    if (!entrenador) return;

    this.desactivando.set(true);
    this.errorBaja.set('');

    this.servicio.desactivar(entrenador.id).subscribe({
      next: () => {
        this.entrenadores.update((lista) => lista.filter((e) => e.id !== entrenador.id));
        this.exito.set(`${entrenador.nombre} ${entrenador.apellido} fue dado de baja.`);
        this.desactivando.set(false);
        this.porDesactivar.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.desactivando.set(false);
        this.errorBaja.set(
          e.status === 403
            ? 'No tienes permiso para dar de baja entrenadores.'
            : e.status === 404
              ? 'El entrenador ya no existe.'
              : `No se pudo dar de baja (error ${e.status}).`,
        );
      },
    });
  }
}
