import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Asistencia, AsistenciaRequest } from '../../core/models/asistencia';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private http = inject(HttpClient);

  listar(entrenamientoId: number, fecha: string): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(
      `${ENDPOINTS.asistencias}/entrenamiento/${entrenamientoId}`,
      { params: { fecha } },
    );
  }

  registrar(datos: AsistenciaRequest): Observable<Asistencia> {
    return this.http.post<Asistencia>(ENDPOINTS.asistencias, datos);
  }

  actualizar(id: number, datos: AsistenciaRequest): Observable<Asistencia> {
    return this.http.put<Asistencia>(`${ENDPOINTS.asistencias}/${id}`, datos);
  }
}
