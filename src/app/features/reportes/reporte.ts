import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Movimiento, MovimientoRequest } from '../../core/models/movimiento';
import { ClaveReporte, FilaReporte } from '../../core/models/reporte';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);

  /** desde/hasta (YYYY-MM-DD) solo los aplica el servidor a los reportes con fecha. */
  consultar(clave: ClaveReporte, desde?: string, hasta?: string): Observable<FilaReporte[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<FilaReporte[]>(`${ENDPOINTS.reportes}/${clave}`, { params });
  }

  /** Registra un ingreso o egreso adicional (aparece en el flujo de caja). */
  registrarMovimiento(datos: MovimientoRequest): Observable<Movimiento> {
    return this.http.post<Movimiento>(ENDPOINTS.movimientos, datos);
  }
}
