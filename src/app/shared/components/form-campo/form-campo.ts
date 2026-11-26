import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-campo',
  template: `
    <label class="form-label">
      {{ etiqueta() }}
      @if (requerido()) {
        <span class="text-danger"> *</span>
      }
    </label>
    <ng-content />
    @if (error()) {
      <div class="text-danger small mt-1">
        <i class="bi bi-exclamation-circle me-1"></i>{{ error() }}
      </div>
    } @else if (ayuda()) {
      <div class="form-text">{{ ayuda() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FormCampo {
  etiqueta = input.required<string>();
  requerido = input(false);
  error = input('');
  ayuda = input('');
}
