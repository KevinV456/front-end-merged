import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="telon" (click)="cerrar.emit()"></div>
    <div class="ventana" role="dialog" aria-modal="true" [style.max-width.px]="ancho()">
      <div class="cabecera">
        <h2>{{ titulo() }}</h2>
        <button
          type="button"
          class="btn-close"
          aria-label="Cerrar"
          (click)="cerrar.emit()"
        ></button>
      </div>
      <div class="cuerpo"><ng-content /></div>
      <div class="pie"><ng-content select="[pie]" /></div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 1060;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .telon {
      position: absolute;
      inset: 0;
      background: rgba(11, 46, 34, 0.55);
    }
    .ventana {
      position: relative;
      width: 100%;
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }
    .cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--ts-borde);
    }
    .cabecera h2 {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0;
    }
    .cuerpo {
      padding: 1.25rem;
      overflow-y: auto;
    }
    .pie {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--ts-borde);
    }
    .pie:empty {
      display: none;
    }
  `,
})
export class Modal {
  titulo = input.required<string>();
  ancho = input(640);
  cerrar = output<void>();

  @HostListener('document:keydown.escape')
  alPresionarEscape() {
    this.cerrar.emit();
  }
}
