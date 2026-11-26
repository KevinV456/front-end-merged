import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Nino } from '../../../core/models/nino';
import { Modal } from '../../../shared/components/modal/modal';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { EdadPipe } from '../../../shared/pipes/edad-pipe';
import { FechaPipe } from '../../../shared/pipes/fecha-pipe';
import { NinoPagos } from '../../pagos/nino-pagos/nino-pagos';

@Component({
  selector: 'app-nino-detalle',
  imports: [RouterLink, Modal, BadgeEstado, EdadPipe, FechaPipe, NinoPagos],
  templateUrl: './nino-detalle.html',
  styleUrl: './nino-detalle.css',
})
export class NinoDetalle {
  nino = input.required<Nino>();
  cerrar = output<void>();
  auth = inject(Auth);

  /** Pestaña activa de la ficha. */
  pestana = signal<'datos' | 'pagos'>('datos');

  iniciales = computed(() => `${this.nino().nombre.charAt(0)}${this.nino().apellido.charAt(0)}`);
}
