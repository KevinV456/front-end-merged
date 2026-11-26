import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Alquiler, AlquilerRequest, EstadoAlquiler } from '../../core/models/alquiler';

@Injectable({ providedIn: 'root' })
export class AlquilerService {
  private http = inject(HttpClient);

  listar(): Observable<Alquiler[]> {
    return this.http.get<Alquiler[]>(ENDPOINTS.alquileres);
  }

  porFecha(fecha: string): Observable<Alquiler[]> {
    return this.http.get<Alquiler[]>(`${ENDPOINTS.alquileres}/fecha/${fecha}`);
  }

  obtener(id: number): Observable<Alquiler> {
    return this.http.get<Alquiler>(`${ENDPOINTS.alquileres}/${id}`);
  }

  /** El backend valida el choque de horario y responde 409 con { mensaje }. */
  crear(datos: AlquilerRequest): Observable<Alquiler> {
    return this.http.post<Alquiler>(ENDPOINTS.alquileres, datos);
  }

  actualizar(id: number, datos: AlquilerRequest): Observable<Alquiler> {
    return this.http.put<Alquiler>(`${ENDPOINTS.alquileres}/${id}`, datos);
  }

  /** No existe un endpoint de cancelación: se hace un PUT con el mismo alquiler en estado CANCELADO. */
  cancelar(alquiler: Alquiler): Observable<Alquiler> {
    return this.actualizar(alquiler.id, this.aRequest(alquiler, 'CANCELADO'));
  }

  private aRequest(a: Alquiler, estado: EstadoAlquiler): AlquilerRequest {
    return {
      cancha: { id: a.cancha.id },
      fecha: a.fecha,
      horario: a.horario,
      solicitante: a.solicitante,
      contacto: a.contacto,
      monto: a.monto,
      estado,
    };
  }
}
