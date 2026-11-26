export type EstadoCancha = 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO';

export const ESTADOS_CANCHA: { valor: EstadoCancha; texto: string }[] = [
  { valor: 'DISPONIBLE', texto: 'Disponible' },
  { valor: 'OCUPADA', texto: 'Ocupada' },
  { valor: 'MANTENIMIENTO', texto: 'En mantenimiento' },
];

/** La entidad Cancha del backend no tiene nombre: solo id, horario de atención y estado. */
export interface Cancha {
  id: number;
  /** Horario de atención, por ejemplo "15:00 - 20:00". */
  horario: string;
  estado: EstadoCancha;
}

/** Cuerpo de POST y PUT. */
export interface CanchaRequest {
  horario: string;
  estado: EstadoCancha;
}

/** Como la academia no guarda un nombre para la cancha, se muestra "Cancha 1", "Cancha 2"... */
export function nombreCancha(id: number): string {
  return `Cancha ${id}`;
}
