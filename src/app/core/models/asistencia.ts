export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';

export interface Asistencia {
  id: number;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  nino: { id: number };
  entrenamiento: { id: number };
}

/** Cuerpo de POST y PUT: el backend exige los tres primeros campos en ambos. */
export interface AsistenciaRequest {
  entrenamiento: { id: number };
  nino: { id: number };
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
}
