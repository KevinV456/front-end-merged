import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'edad' })
export class EdadPipe implements PipeTransform {
  transform(fecha: string | null | undefined): number | null {
    if (!fecha) return null;
    // Se separa a mano: new Date('YYYY-MM-DD') usa UTC y en Lima puede adelantar o atrasar un día.
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) {
      edad--;
    }
    return edad;
  }
}
