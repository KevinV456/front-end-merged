import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '—';
    const [anio, mes, dia] = valor.split('-').map(Number);
    if (!anio || !mes || !dia) return valor;
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
