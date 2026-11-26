import { Component, inject, signal } from '@angular/core';
import { Publico } from '../publico';

@Component({
  selector: 'app-saludo',
  imports: [],
  templateUrl: './saludo.html',
  styleUrl: './saludo.css'
})
export class Saludo {
  private publicoService = inject(Publico);

  mensaje = signal('');
  error = signal('');
  cargando = signal(false);

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.publicoService.saludo().subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(`Error ${e.status}: no se pudo conectar con el backend`);
        this.cargando.set(false);
      }
    });
  }
}