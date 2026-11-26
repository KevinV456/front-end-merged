export interface ColumnaCsv {
  titulo: string;
  valor: (fila: any) => string | number | boolean | null | undefined;
}

function celda(valor: string | number | boolean | null | undefined): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",\r\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Convierte filas en texto CSV (separador coma, fin de línea CRLF). */
export function aCsv(columnas: ColumnaCsv[], filas: unknown[]): string {
  const encabezado = columnas.map((c) => celda(c.titulo)).join(',');
  const cuerpo = filas.map((f) => columnas.map((c) => celda(c.valor(f))).join(','));
  return [encabezado, ...cuerpo].join('\r\n');
}

/** Descarga el CSV con BOM UTF-8 para que Excel respete las tildes y la ñ. */
export function descargarCsv(nombre: string, contenido: string): void {
  const blob = new Blob(['\uFEFF', contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
