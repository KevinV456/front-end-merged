export type ClaveReporte = 'ninos' | 'horarios' | 'pagos' | 'flujo-caja' | 'asistencia';

/** Una fila de reporte: las claves son los nombres de columna de la vista SQL. */
export type FilaReporte = Record<string, string | number | boolean | null>;
