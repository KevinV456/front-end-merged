import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ENDPOINTS } from '../config/api.config';
import { LoginRequest, LoginResponse, Rol } from '../models/auth';

const CLAVE = 'teamsoccer_sesion';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);

  private sesion = signal<LoginResponse | null>(this.leerSesion());

  usuario = computed(() => this.sesion()?.username ?? '');
  rol = computed(() => this.sesion()?.rol ?? null);
  categoriaId = computed(() => this.sesion()?.categoriaId ?? null);
  estaLogueado(): boolean {
    const token = this.token;
    return !!token && !this.expirado(token);
  }

  get token(): string | null {
    return this.sesion()?.token ?? null;
  }

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(ENDPOINTS.login, datos).pipe(
      map((respuesta) => {
        if (!respuesta?.token) {
          throw new Error('El servidor respondió, pero no devolvió un token de sesión.');
        }
        return respuesta;
      }),
      tap((respuesta) => {
        this.guardarSesion(respuesta);
        this.sesion.set(respuesta);
      }),
    );
  }

  logout(redirigir = true): void {
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // sin acceso a sessionStorage: la sesión solo vive en memoria
    }
    this.sesion.set(null);
    if (redirigir) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  tieneRol(...roles: Rol[]): boolean {
    const actual = this.rol();
    return !!actual && roles.includes(actual);
  }

  private leerSesion(): LoginResponse | null {
    try {
      const guardado = sessionStorage.getItem(CLAVE);
      const sesion: LoginResponse | null = guardado ? JSON.parse(guardado) : null;
      return sesion && !this.expirado(sesion.token) ? sesion : null;
    } catch {
      return null;
    }
  }

  private guardarSesion(sesion: LoginResponse): void {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      // sin acceso a sessionStorage: la sesión solo vive en memoria
    }
  }

  private expirado(token: string): boolean {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(base64));
      return typeof exp === 'number' && exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
