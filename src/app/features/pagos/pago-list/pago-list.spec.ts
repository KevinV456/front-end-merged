import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PagoList } from './pago-list';
import { ENDPOINTS } from '../../../core/config/api.config';

const nino = (id: number, nombre: string) => ({ id, nombre, apellido: 'Prueba', categoria: { id: 1, nombre: 'Cat 2012', anioNacimiento: 2012 } });
const PAGOS = [
  { id: 1, nino: nino(1, 'Mateo'), monto: 80, fecha: '2026-09-03', estado: 'PAGADO' },
  { id: 2, nino: nino(1, 'Mateo'), monto: 80, fecha: '2026-10-31', estado: 'PENDIENTE' },
  { id: 3, nino: nino(2, 'Diego'), monto: 50, fecha: '2026-10-31', estado: 'PENDIENTE' },
];

describe('PagoList', () => {
  let http: HttpTestingController;

  function crear() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PagoList);
    http.expectOne(ENDPOINTS.pagos).flush(PAGOS);
    return fixture.componentInstance;
  }

  it('suma solo lo pendiente y lista todos los pagos', () => {
    const c = crear();
    expect(c.visibles().length).toBe(3);
    expect(c.totalPendiente()).toBe(130);
    expect(c.cantidadPendiente()).toBe(2);
  });

  it('filtra por estado y por niño, y el total sigue al niño elegido', () => {
    const c = crear();
    c.filtrarEstado('PAGADO');
    expect(c.visibles().map((p) => p.id)).toEqual([1]);

    c.filtrarEstado('');
    c.filtrarNino('2');
    expect(c.visibles().map((p) => p.id)).toEqual([3]);
    expect(c.totalPendiente()).toBe(50);

    c.limpiar();
    expect(c.visibles().length).toBe(3);
  });

  it('marcar como pagado llama a PUT /pagar y actualiza la fila', () => {
    const c = crear();
    c.pedirPago(PAGOS[1] as any);
    c.confirmarPago();
    const req = http.expectOne(`${ENDPOINTS.pagos}/2/pagar`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...PAGOS[1], estado: 'PAGADO', fecha: '2026-10-12' });

    expect(c.pagos().find((p) => p.id === 2)?.estado).toBe('PAGADO');
    expect(c.totalPendiente()).toBe(50);
    expect(c.porPagar()).toBeNull();
  });

  it('muestra el error del servidor si falla el pago', () => {
    const c = crear();
    c.pedirPago(PAGOS[1] as any);
    c.confirmarPago();
    http.expectOne(`${ENDPOINTS.pagos}/2/pagar`).flush({}, { status: 404, statusText: 'Not Found' });
    expect(c.errorPago()).toContain('ya no existe');
    expect(c.porPagar()).not.toBeNull();
  });
});
