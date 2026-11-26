import { Categoria } from './categoria';

export type Modalidad = 'FUTBOL_7' | 'FUTBOL_11';

export const TALLAS = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL'] as const;
export type TallaUniforme = (typeof TALLAS)[number];
export const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'] as const;

export interface Nino {
  id: number;
  dni: string | null;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  categoriaId: number | null;
  categoriaNombre: string;
  modalidad: Modalidad;
  posicion: string | null;
  altura: number | null;
  peso: number | null;
  tallaUniforme: TallaUniforme | null;
  apoderadoNombre: string;
  apoderadoTelefono: string;
  fechaInscripcion: string | null;
  activo: boolean;
  categoria?: Categoria | null;
  edad?: number;
}

/** Lo que Angular envía al registrar o editar. */
export interface NinoRequest {
  dni: string | null;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  categoriaId: number;
  modalidad: Modalidad;
  posicion: string | null;
  altura: number | null;
  peso: number | null;
  tallaUniforme: TallaUniforme | null;
  apoderadoNombre: string;
  apoderadoTelefono: string;
}
