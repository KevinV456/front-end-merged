import { Cancha } from './cancha';

export type EstadoAlquiler = 'RESERVADO' | 'FINALIZADO' | 'CANCELADO';

export const ESTADOS_ALQUILER: { valor: EstadoAlquiler; texto: string }[] = [
  { valor: 'RESERVADO', texto: 'Reservado' },
  { valor: 'FINALIZADO', texto: 'Finalizado' },
  { valor: 'CANCELADO', texto: 'Cancelado' },
];

export interface Alquiler {
  id: number;
  cancha: Cancha;
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:mm-HH:mm */
  horario: string;
  /** Persona o club que alquila la cancha (el "cliente"). */
  solicitante: string;
  contacto: string | null;
  monto: number;
  estado: EstadoAlquiler;
}

/** Cuerpo de POST y PUT (el backend espera la cancha como { id }). */
export interface AlquilerRequest {
  cancha: { id: number };
  fecha: string;
  horario: string;
  solicitante: string;
  contacto: string | null;
  monto: number;
  estado: EstadoAlquiler;
}
