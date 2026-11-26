import { environment } from '../../../environments/environment';

export const API_URL = environment.apiUrl;

export const ENDPOINTS = {
  // Acceso
  login: `${API_URL}/auth/login`,
  saludo: `${API_URL}/publico/saludo`,

  // Niños y categorías
  ninos: `${API_URL}/nino`,
  ninosBuscar: `${API_URL}/nino/buscar/nombre`,
  categorias: `${API_URL}/categoria`,

  // Entrenamientos y asistencia
  entrenamientos: `${API_URL}/entrenamiento`,
  asistencias: `${API_URL}/asistencia`,

  // Módulos nuevos
  entrenadores: `${API_URL}/entrenador`,
  canchas: `${API_URL}/cancha`,
  alquileres: `${API_URL}/alquiler`,
  pagos: `${API_URL}/pago`,
  movimientos: `${API_URL}/movimiento`,

  // Endpoints de reportes y cuentas de acceso
  usuarios: `${API_URL}/usuario`,
  reportes: `${API_URL}/reporte`,
} as const;
