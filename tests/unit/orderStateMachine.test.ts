import { assertTransition } from '../../src/domain/orderStateMachine';
import { calculateQuoteTotal } from '../../src/domain/quote';

describe('orderStateMachine', () => {
  it('permite el flujo normal', () => {
    expect(() => assertTransition('RECIBIDO', 'ASIGNADO')).not.toThrow();
    expect(() => assertTransition('PRESUPUESTADO', 'EN_REPARACION')).not.toThrow();
    expect(() => assertTransition('PRESUPUESTADO', 'RECHAZADO')).not.toThrow();
    expect(() => assertTransition('LISTO', 'ENTREGADO')).not.toThrow();
  });

  it('permite cancelar mientras la reparación no empezó', () => {
    expect(() => assertTransition('RECIBIDO', 'CANCELADO')).not.toThrow();
    expect(() => assertTransition('ASIGNADO', 'CANCELADO')).not.toThrow();
    expect(() => assertTransition('PRESUPUESTADO', 'CANCELADO')).not.toThrow();
  });

  it('no permite cancelar una reparación en curso, terminada o ya cerrada', () => {
    expect(() => assertTransition('EN_REPARACION', 'CANCELADO')).toThrow();
    expect(() => assertTransition('LISTO', 'CANCELADO')).toThrow();
    expect(() => assertTransition('ENTREGADO', 'CANCELADO')).toThrow();
    expect(() => assertTransition('CANCELADO', 'ASIGNADO')).toThrow();
  });
 
  it('rechaza saltos de estado y retrocesos', () => {
    expect(() => assertTransition('RECIBIDO', 'LISTO')).toThrow();
    expect(() => assertTransition('ENTREGADO', 'LISTO')).toThrow();
    expect(() => assertTransition('RECHAZADO', 'EN_REPARACION')).toThrow();
  });
});

describe('calculateQuoteTotal', () => {
  it('suma mano de obra y repuestos', () => {
    const lines = [
      { sku: 'A', name: 'A', unitPrice: 1000, quantity: 2 },
      { sku: 'B', name: 'B', unitPrice: 500, quantity: 1 }
    ];
    expect(calculateQuoteTotal(3000, lines)).toBe(5500);
  });

  it('sin repuestos el total es la mano de obra', () => {
    expect(calculateQuoteTotal(3000, [])).toBe(3000);
  });
});
