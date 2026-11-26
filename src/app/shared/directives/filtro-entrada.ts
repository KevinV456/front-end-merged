import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/** appFiltro="digitos" solo deja números; appFiltro="letras" solo letras, espacios, guion y apóstrofe. */
@Directive({ selector: 'input[appFiltro]' })
export class FiltroEntrada {
  appFiltro = input.required<string>();
  private ngControl = inject(NgControl, { self: true });

  @HostListener('input', ['$event'])
  alEscribir(evento: Event) {
    const el = evento.target as HTMLInputElement | null;
    if (!el) return;

    const prohibido = this.appFiltro() === 'digitos' ? /\D/g : /[^\p{L}\s'’-]/gu;
    const limpio = el.value.replace(prohibido, '');

    if (limpio !== el.value) {
      el.value = limpio;
      this.ngControl.control?.setValue(limpio);
    }
  }
}
