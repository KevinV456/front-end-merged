import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NinoService } from '../nino';
import { Auth } from '../../../core/services/auth';
import { Nino } from '../../../core/models/nino';
import { Categoria } from '../../../core/models/categoria';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { Modal } from '../../../shared/components/modal/modal';
import { EdadPipe } from '../../../shared/pipes/edad-pipe';
import { NinoDetalle } from '../nino-detalle/nino-detalle';

@Component({
  selector: 'app-nino-list',
  imports: [RouterLink, PageHeader, BadgeEstado, EstadoVacio, Modal, EdadPipe, NinoDetalle],
  templateUrl: './nino-list.html',
})
export class NinoList {
  private ninoService = inject(NinoService);
  auth = inject(Auth);

  ninos = signal<Nino[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  categoriaSeleccionada = signal('');
  texto = signal('');

  verNino = signal<Nino | null>(null);
  porDesactivar = signal<Nino | null>(null);
  desactivando = signal(false);
  errorBaja = signal('');

  constructor() {
    this.ninoService.categorias().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: () => this.categorias.set([]),
    });
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.exito.set('');

    const peticion = this.texto().trim()
      ? this.ninoService.buscarPorNombre(this.texto().trim())
      : this.ninoService.listar(this.categoriaSeleccionada());

    peticion.subscribe({
      next: (lista) => {
        this.ninos.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'No tienes permiso para ver esta información (403)'
            : `No se pudo cargar la lista (error ${e.status})`,
        );
      },
    });
  }

  filtrarCategoria(valor: string) {
    this.categoriaSeleccionada.set(valor);
    this.texto.set('');
    this.cargar();
  }

  buscar(valor: string) {
    this.texto.set(valor);
    this.categoriaSeleccionada.set('');
    this.cargar();
  }

  limpiar() {
    this.texto.set('');
    this.categoriaSeleccionada.set('');
    this.cargar();
  }

  pedirBaja(nino: Nino) {
    this.errorBaja.set('');
    this.porDesactivar.set(nino);
  }

  cancelarBaja() {
    if (!this.desactivando()) this.porDesactivar.set(null);
  }

  confirmarBaja() {
    const nino = this.porDesactivar();
    if (!nino) return;

    this.desactivando.set(true);
    this.errorBaja.set('');

    this.ninoService.desactivar(nino.id).subscribe({
      next: () => {
        this.ninos.update((lista) => lista.filter((n) => n.id !== nino.id));
        this.exito.set(`${nino.nombre} ${nino.apellido} fue dado de baja.`);
        this.desactivando.set(false);
        this.porDesactivar.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.desactivando.set(false);
        this.errorBaja.set(
          e.status === 403
            ? 'No tienes permiso para dar de baja niños.'
            : e.status === 404
              ? 'El niño ya no existe.'
              : `No se pudo dar de baja (error ${e.status}).`,
        );
      },
    });
  }
}
