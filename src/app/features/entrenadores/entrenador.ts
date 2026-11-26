import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Categoria } from '../../core/models/categoria';
import {
  Entrenador,
  EntrenadorRequest,
  UsuarioRequest,
  UsuarioResponse,
} from '../../core/models/entrenador';

@Injectable({ providedIn: 'root' })
export class EntrenadorService {
  private http = inject(HttpClient);

  /** El backend espera catAsignada: { id } (o null si no tiene categoría). */
  private cuerpo(datos: EntrenadorRequest) {
    const { categoriaId, ...resto } = datos;
    return { ...resto, catAsignada: categoriaId ? { id: categoriaId } : null };
  }

  listar(): Observable<Entrenador[]> {
    return this.http.get<Entrenador[]>(ENDPOINTS.entrenadores);
  }

  obtener(id: number): Observable<Entrenador> {
    return this.http.get<Entrenador>(`${ENDPOINTS.entrenadores}/${id}`);
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(ENDPOINTS.categorias);
  }

  crear(datos: EntrenadorRequest): Observable<Entrenador> {
    return this.http.post<Entrenador>(ENDPOINTS.entrenadores, this.cuerpo(datos));
  }

  actualizar(id: number, datos: EntrenadorRequest): Observable<Entrenador> {
    return this.http.put<Entrenador>(`${ENDPOINTS.entrenadores}/${id}`, this.cuerpo(datos));
  }

  /** Baja lógica (DELETE → 204). */
  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${ENDPOINTS.entrenadores}/${id}`);
  }

  /** Cuenta de acceso del entrenador (POST /api/usuario, solo ADMIN). */
  crearUsuario(datos: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(ENDPOINTS.usuarios, datos);
  }
}
