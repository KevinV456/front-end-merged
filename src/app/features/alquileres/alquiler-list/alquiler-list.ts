import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AlquilerService } from '../alquiler';
import { CanchaService } from '../../canchas/cancha';
import { Alquiler, ESTADOS_ALQUILER, EstadoAlquiler } from '../../../core/models/alquiler';
import { Cancha, nombreCancha } from '../../../core/models/cancha';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado, Tono } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { Modal } from '../../../shared/components/modal/modal';
import { FechaPipe } from '../../../shared/pipes/fecha-pipe';
import { DisponibilidadSemanal } from '../disponibilidad-semanal/disponibilidad-semanal';

@Component({
  selector: 'app-alquiler-list',
  imports: [
    RouterLink,
    CurrencyPipe,
    PageHeader,
    BadgeEstado,
    EstadoVacio,
    Modal,
    FechaPipe,
    DisponibilidadSemanal,
  ],
  templateUrl: './alquiler-list.html',
})
export class AlquilerList {
  private alquilerService = inject(AlquilerService);
  private canchaService = inject(CanchaService);

  readonly estados = ESTADOS_ALQUILER;
  readonly nombreCancha = nombreCancha;

  alquileres = signal<Alquiler[]>([]);
  canchas = signal<Cancha[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  vista = signal<'lista' | 'semana'>('lista');

  // Filtros ('' = todos)
  fecha = signal('');
  canchaId = signal('');
  estado = signal('');

  filtrados = computed(() => {
    const fecha = this.fecha();
    const canchaId = this.canchaId();
    const estado = this.estado();
    return this.alquileres()
      .filter(
        (a) =>
          (!fecha || a.fecha === fecha) &&
          (!canchaId || String(a.cancha.id) === canchaId) &&
          (!estado || a.estado === estado),
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.horario.localeCompare(b.horario));
  });

  hayFiltros = computed(() => !!(this.fecha() || this.canchaId() || this.estado()));

  porCancelar = signal<Alquiler | null>(null);
  cancelando = signal(false);
  errorCancelar = signal('');

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');

    forkJoin({
      alquileres: this.alquilerService.listar(),
      canchas: this.canchaService.listar(),
    }).subscribe({
      next: ({ alquileres, canchas }) => {
        this.alquileres.set(alquileres);
        this.canchas.set([...canchas].sort((a, b) => a.id - b.id));
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'No tienes permiso para ver los alquileres (403)'
            : `No se pudo cargar la lista (error ${e.status})`,
        );
      },
    });
  }

  limpiar() {
    this.fecha.set('');
    this.canchaId.set('');
    this.estado.set('');
  }

  tono(estado: EstadoAlquiler): Tono {
    return estado === 'RESERVADO' ? 'azul' : estado === 'FINALIZADO' ? 'verde' : 'rojo';
  }

  texto(estado: EstadoAlquiler): string {
    return this.estados.find((e) => e.valor === estado)?.texto ?? estado;
  }

  pedirCancelacion(alquiler: Alquiler) {
    this.errorCancelar.set('');
    this.porCancelar.set(alquiler);
  }

  volver() {
    if (!this.cancelando()) this.porCancelar.set(null);
  }

  confirmarCancelacion() {
    const alquiler = this.porCancelar();
    if (!alquiler) return;

    this.cancelando.set(true);
    this.errorCancelar.set('');

    this.alquilerService.cancelar(alquiler).subscribe({
      next: (actualizado) => {
        this.alquileres.update((lista) =>
          lista.map((a) => (a.id === alquiler.id ? actualizado : a)),
        );
        this.exito.set(`Se canceló el alquiler de ${alquiler.solicitante}.`);
        this.cancelando.set(false);
        this.porCancelar.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.cancelando.set(false);
        this.errorCancelar.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor.'
            : e.status === 403
              ? 'No tienes permiso para cancelar alquileres.'
              : e.status === 404
                ? 'El alquiler ya no existe.'
                : (e.error?.mensaje ?? `No se pudo cancelar (error ${e.status}).`),
        );
      },
    });
  }
}
