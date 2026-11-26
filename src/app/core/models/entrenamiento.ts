import { Categoria } from './categoria';

export type DiaEntrenamiento = 'LUNES' | 'MIERCOLES' | 'VIERNES';

export interface Entrenamiento {
  id: number;
  dia: DiaEntrenamiento;
  horario: string;
  categoria: Categoria;
  entrenador?: { id: number; nombre: string; apellido: string };
  cancha?: { id: number; nombre?: string };
}
