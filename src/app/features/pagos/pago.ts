import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Pago, PagoRequest } from '../../core/models/pago';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private http = inject(HttpClient);

  listar(): Observable<Pago[]> {
    return this.http.get<Pago[]>(ENDPOINTS.pagos);
  }

  /** Historial de mensualidades de un niño. */
  porNino(ninoId: number): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${ENDPOINTS.pagos}/nino/${ninoId}`);
  }

  crear(datos: PagoRequest): Observable<Pago> {
    return this.http.post<Pago>(ENDPOINTS.pagos, datos);
  }

  /** PUT /pago/{id}/pagar: queda PAGADO con la fecha de hoy (sin cuerpo). */
  marcarPagado(id: number): Observable<Pago> {
    return this.http.put<Pago>(`${ENDPOINTS.pagos}/${id}/pagar`, null);
  }
}
