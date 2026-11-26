import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ENDPOINTS } from '../../core/config/api.config';
import { Categoria } from '../../core/models/categoria';
import { Nino, NinoRequest } from '../../core/models/nino';

@Injectable({ providedIn: 'root' })
export class NinoService {
  private http = inject(HttpClient);

  /** El backend devuelve { categoria: {...} }; la interfaz usa categoriaId y categoriaNombre. */
  private normalizar(n: any): Nino {
    return {
      ...n,
      categoriaId: n.categoriaId ?? n.categoria?.id ?? null,
      categoriaNombre: n.categoriaNombre ?? n.categoria?.nombre ?? '',
    };
  }

  /** El backend espera categoria: { id }. */
  private cuerpo(datos: NinoRequest) {
    const { categoriaId, ...resto } = datos;
    return { ...resto, categoria: { id: categoriaId } };
  }

  listar(anioCategoria?: string): Observable<Nino[]> {
    let params = new HttpParams();
    if (anioCategoria) params = params.set('categoria', anioCategoria);
    return this.http
      .get<any[]>(ENDPOINTS.ninos, { params })
      .pipe(map((lista) => lista.map((n) => this.normalizar(n))));
  }

  buscarPorNombre(texto: string): Observable<Nino[]> {
    return this.http
      .get<any[]>(ENDPOINTS.ninosBuscar, { params: { texto } })
      .pipe(map((lista) => lista.map((n) => this.normalizar(n))));
  }

  obtener(id: number): Observable<Nino> {
    return this.http.get<any>(`${ENDPOINTS.ninos}/${id}`).pipe(map((n) => this.normalizar(n)));
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(ENDPOINTS.categorias);
  }

  crear(datos: NinoRequest): Observable<Nino> {
    return this.http
      .post<any>(ENDPOINTS.ninos, this.cuerpo(datos))
      .pipe(map((n) => this.normalizar(n)));
  }

  actualizar(id: number, datos: NinoRequest): Observable<Nino> {
    return this.http
      .put<any>(`${ENDPOINTS.ninos}/${id}`, this.cuerpo(datos))
      .pipe(map((n) => this.normalizar(n)));
  }

  /** Baja lógica (DELETE → 204). */
  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${ENDPOINTS.ninos}/${id}`);
  }
}
