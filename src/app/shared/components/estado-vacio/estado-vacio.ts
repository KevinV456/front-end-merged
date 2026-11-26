import { Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="text-center text-muted py-5">
      <i class="bi {{ icono() }} fs-1 d-block mb-2 opacity-50"></i>
      <div>{{ mensaje() }}</div>
    </div>
  `,
})
export class EstadoVacio {
  icono = input('bi-inbox');
  mensaje = input.required<string>();
}
