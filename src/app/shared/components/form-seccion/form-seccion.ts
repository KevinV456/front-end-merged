import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-seccion',
  template: `
    <section class="mb-4">
      <h2 class="titulo"><i class="bi {{ icono() }}"></i>{{ titulo() }}</h2>
      <ng-content />
    </section>
  `,
  styles: `
    .titulo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ts-700);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid var(--ts-100);
    }
  `,
})
export class FormSeccion {
  titulo = input.required<string>();
  icono = input('bi-circle');
}
