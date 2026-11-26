import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Entrenamiento } from '../../core/models/entrenamiento';

@Injectable({ providedIn: 'root' })
export class EntrenamientoService {
  private http = inject(HttpClient);

  listar(): Observable<Entrenamiento[]> {
    return this.http.get<Entrenamiento[]>(ENDPOINTS.entrenamientos);
  }

  porCategoria(categoriaId: number): Observable<Entrenamiento[]> {
    return this.http.get<Entrenamiento[]>(`${ENDPOINTS.entrenamientos}/categoria/${categoriaId}`);
  }
}
