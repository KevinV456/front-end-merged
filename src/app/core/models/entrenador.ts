import { Categoria } from './categoria';
import { Rol } from './auth';

export interface Entrenador {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  contacto: string;
  correo: string | null;
  catAsignada: Categoria | null;
  activo: boolean;
}

/** Lo que Angular envía al registrar o editar un entrenador. */
export interface EntrenadorRequest {
  dni: string;
  nombre: string;
  apellido: string;
  contacto: string;
  correo: string | null;
  categoriaId: number | null;
}

/** POST /api/usuario (solo ADMIN). */
export interface UsuarioRequest {
  username: string;
  password: string;
  rol: Rol;
  entrenadorId: number | null;
}

export interface UsuarioResponse {
  id: number;
  username: string;
  rol: Rol;
  entrenadorId: number | null;
  activo: boolean;
}
