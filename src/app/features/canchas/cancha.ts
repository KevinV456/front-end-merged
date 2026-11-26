import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Cancha, CanchaRequest } from '../../core/models/cancha';

@Injectable({ providedIn: 'root' })
export class CanchaService {
  private http = inject(HttpClient);

  listar(): Observable<Cancha[]> {
    return this.http.get<Cancha[]>(ENDPOINTS.canchas);
  }

  obtener(id: number): Observable<Cancha> {
    return this.http.get<Cancha>(`${ENDPOINTS.canchas}/${id}`);
  }

  crear(datos: CanchaRequest): Observable<Cancha> {
    return this.http.post<Cancha>(ENDPOINTS.canchas, datos);
  }

  actualizar(id: number, datos: CanchaRequest): Observable<Cancha> {
    return this.http.put<Cancha>(`${ENDPOINTS.canchas}/${id}`, datos);
  }

  /** DELETE → 204. El backend elimina el registro; falla con 409 si la cancha está en uso. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${ENDPOINTS.canchas}/${id}`);
  }
}
