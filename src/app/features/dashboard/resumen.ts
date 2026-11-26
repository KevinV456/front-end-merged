import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { NinoService } from '../ninos/nino';
import { EntrenamientoService } from '../entrenamientos/entrenamiento';
import { AlquilerService } from '../alquileres/alquiler';
import { aISO, diaEntrenamiento } from '../../shared/utils/tiempo';

/** Cifras del dashboard. Cada una es una consulta independiente: si una falla, las demás se muestran. */
@Injectable({ providedIn: 'root' })
export class ResumenService {
  private http = inject(HttpClient);
  private ninoService = inject(NinoService);
  private entrenamientoService = inject(EntrenamientoService);
  private alquilerService = inject(AlquilerService);

  /** El backend solo lista los niños activos. */
  ninosActivos(): Observable<number> {
    return this.ninoService.listar().pipe(map((lista) => lista.length));
  }

  /** Solo ADMIN. Se consulta el endpoint directamente para no depender del módulo de pagos. */
  pagosPendientes(): Observable<number> {
    return this.http
      .get<unknown[]>(`${ENDPOINTS.pagos}/estado/PENDIENTE`)
      .pipe(map((lista) => lista.length));
  }

  /**
   * Entrenamientos que se dictan hoy (lunes, miércoles o viernes).
   * Con categoriaId solo se cuentan los de esa categoría (es lo que ve un entrenador).
   */
  sesionesHoy(categoriaId: number | null): Observable<number> {
    const dia = diaEntrenamiento(new Date());
    if (!dia) return of(0);

    const lista$ =
      categoriaId !== null
        ? this.entrenamientoService.porCategoria(categoriaId)
        : this.entrenamientoService.listar();
    return lista$.pipe(map((lista) => lista.filter((e) => e.dia === dia).length));
  }

  /** Solo ADMIN. Los alquileres cancelados no cuentan. */
  alquileresHoy(): Observable<number> {
    return this.alquilerService
      .porFecha(aISO(new Date()))
      .pipe(map((lista) => lista.filter((a) => a.estado !== 'CANCELADO').length));
  }
}
