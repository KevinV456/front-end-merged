import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PagoService } from '../pago';
import { Pago } from '../../../core/models/pago';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { Modal } from '../../../shared/components/modal/modal';
import { FechaPipe } from '../../../shared/pipes/fecha-pipe';
import {
  TEXTO_PAGO,
  TONO_PAGO,
  estadoVisible,
  totalPendiente,
} from '../../../shared/utils/pagos';

type FiltroEstado = '' | 'PENDIENTE' | 'PAGADO';

@Component({
  selector: 'app-pago-list',
  imports: [RouterLink, CurrencyPipe, PageHeader, BadgeEstado, EstadoVacio, Modal, FechaPipe],
  templateUrl: './pago-list.html',
})
export class PagoList {
  private pagoService = inject(PagoService);

  pagos = signal<Pago[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  estado = signal<FiltroEstado>('');
  /** Id del niño elegido ('' = todos). */
  ninoId = signal('');

  readonly tono = TONO_PAGO;
  readonly texto = TEXTO_PAGO;
  readonly estadoVisible = estadoVisible;

  /** Niños que aparecen en los pagos, para el filtro (incluye a los dados de baja). */
  ninos = computed(() => {
    const unicos = new Map<number, string>();
    for (const p of this.pagos()) {
      unicos.set(p.nino.id, `${p.nino.apellido}, ${p.nino.nombre}`);
    }
    return [...unicos].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  });

  /** Pagos del niño elegido (todos si no se eligió ninguno): base del total y del filtro por estado. */
  delNino = computed(() => {
    const id = this.ninoId();
    return id ? this.pagos().filter((p) => p.nino.id === Number(id)) : this.pagos();
  });

  visibles = computed(() => {
    const e = this.estado();
    return this.delNino()
      .filter((p) => !e || p.estado === e)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  });

  totalPendiente = computed(() => totalPendiente(this.delNino()));
  cantidadPendiente = computed(() => this.delNino().filter((p) => p.estado === 'PENDIENTE').length);

  porPagar = signal<Pago | null>(null);
  procesando = signal(false);
  errorPago = signal('');

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.pagoService.listar().subscribe({
      next: (lista) => {
        this.pagos.set(lista);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'Solo el administrador puede ver los pagos (403).'
            : `No se pudo cargar la lista (error ${e.status}).`,
        );
      },
    });
  }

  filtrarEstado(valor: string) {
    this.estado.set(valor as FiltroEstado);
    this.exito.set('');
  }

  filtrarNino(valor: string) {
    this.ninoId.set(valor);
    this.exito.set('');
  }

  limpiar() {
    this.estado.set('');
    this.ninoId.set('');
    this.exito.set('');
  }

  // ---------- Marcar como pagado ----------

  pedirPago(pago: Pago) {
    this.errorPago.set('');
    this.porPagar.set(pago);
  }

  cancelarPago() {
    if (!this.procesando()) this.porPagar.set(null);
  }

  confirmarPago() {
    const pago = this.porPagar();
    if (!pago) return;

    this.procesando.set(true);
    this.errorPago.set('');

    this.pagoService.marcarPagado(pago.id).subscribe({
      next: (actualizado) => {
        this.pagos.update((lista) => lista.map((p) => (p.id === pago.id ? actualizado : p)));
        this.exito.set(
          `Se registró el pago de ${pago.nino.nombre} ${pago.nino.apellido} (${new FechaPipe().transform(actualizado.fecha)}).`,
        );
        this.procesando.set(false);
        this.porPagar.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(false);
        this.errorPago.set(
          e.status === 403
            ? 'No tienes permiso para registrar pagos.'
            : e.status === 404
              ? 'La mensualidad ya no existe.'
              : `No se pudo registrar el pago (error ${e.status}).`,
        );
      },
    });
  }
}
