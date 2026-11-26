import { Component, input } from '@angular/core';

export type Tono = 'verde' | 'lima' | 'gris' | 'rojo' | 'azul';

@Component({
  selector: 'app-badge-estado',
  template: `<span class="chip" [class]="tono()"><ng-content /></span>`,
  styles: `
    .chip {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .verde {
      background: #e3f3ea;
      color: #145a3d;
    }
    .lima {
      background: #f1fbc9;
      color: #4d6410;
    }
    .gris {
      background: #eceff1;
      color: #4a5a52;
    }
    .rojo {
      background: #fde8e8;
      color: #9b2c2c;
    }
    .azul {
      background: #e3effb;
      color: #1d4f86;
    }
  `,
})
export class BadgeEstado {
  tono = input<Tono>('gris');
}
