import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <div class="d-flex align-items-center gap-3">
        @if (volverA()) {
          <a [routerLink]="volverA()" class="btn btn-outline-secondary btn-sm" title="Volver">
            <i class="bi bi-arrow-left"></i>
          </a>
        }
        <div>
          <h1 class="h4 fw-bold mb-0">{{ titulo() }}</h1>
          @if (subtitulo()) {
            <p class="text-muted small mb-0">{{ subtitulo() }}</p>
          }
        </div>
      </div>
      <div class="d-flex gap-2"><ng-content /></div>
    </div>
  `,
})
export class PageHeader {
  titulo = input.required<string>();
  subtitulo = input('');
  volverA = input<string | null>(null);
}
