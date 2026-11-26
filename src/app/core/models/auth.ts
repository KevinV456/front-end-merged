export type Rol = 'ADMIN' | 'ENTRENADOR';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  rol: Rol;
  categoriaId?: number | null;
  categoriaNombre?: string | null;
}
