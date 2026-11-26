import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PagoService } from '../pago';
import { Pago } from '../../../core/models/pago';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { FechaPipe } from '../../../shared/pipes/fecha-pipe';
import { TEXTO_PAGO, TONO_PAGO, estadoVisible, totalPendiente } from '../../../shared/utils/pagos';

/** Historial de mensualidades de un niño: pestaña "Pagos" de la ficha (solo ADMIN). */
@Component({
  selector: 'app-nino-pagos',
  imports: [RouterLink, CurrencyPipe, BadgeEstado, EstadoVacio, FechaPipe],
  template: `
    @if (cargando()) {
      <div class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando pagos...
      </div>
    } @else if (error()) {
      <div class="alert alert-danger mb-0">{{ error() }}</div>
    } @else {
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <div class="text-muted small">Total pendiente</div>
          <div class="fs-4 fw-bold lh-1">{{ pendiente() | currency: 'PEN' : 'S/ ' }}</div>
        </div>
        <a [routerLink]="['/pagos/nuevo']" [queryParams]="{ nino: ninoId() }" class="btn btn-sm btn-primary">
          <i class="bi bi-plus-lg me-1"></i>Registrar mensualidad
        </a>
      </div>

      @if (pagos().length === 0) {
        <app-estado-vacio icono="bi-cash-coin" mensaje="Este niño aún no tiene mensualidades." />
      } @else {
        <div class="table-responsive">
          <table class="table table-ts align-middle mb-0">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (p of pagos(); track p.id) {
                <tr>
                  <td class="lh-sm">
                    <div>{{ p.fecha | fecha }}</div>
                    <small class="text-muted">{{
                      p.estado === 'PAGADO' ? 'Fecha de pago' : 'Vence'
                    }}</small>
                  </td>
                  <td class="fw-semibold">{{ p.monto | currency: 'PEN' : 'S/ ' }}</td>
                  <td>
                    <app-badge-estado [tono]="tono[estadoVisible(p)]">{{
                      texto[estadoVisible(p)]
                    }}</app-badge-estado>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
})
export class NinoPagos implements OnInit {
  private pagoService = inject(PagoService);

  ninoId = input.required<number>();

  cargando = signal(true);
  error = signal('');
  private datos = signal<Pago[]>([]);

  readonly tono = TONO_PAGO;
  readonly texto = TEXTO_PAGO;
  readonly estadoVisible = estadoVisible;

  /** Del más reciente al más antiguo. */
  pagos = computed(() =>
    [...this.datos()].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id),
  );
  pendiente = computed(() => totalPendiente(this.datos()));

  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.pagoService.porNino(this.ninoId()).subscribe({
      next: (lista) => {
        this.datos.set(lista);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'Solo el administrador puede ver los pagos (403).'
            : `No se pudo cargar el historial (error ${e.status}).`,
        );
      },
    });
  }
}
