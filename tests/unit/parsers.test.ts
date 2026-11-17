import { ValidationError } from '../../src/domain/errors';
import { asBody, optEnum, optString, reqBoolean, reqEnum, reqNumber, reqParts, reqString } from '../../src/http/parsers';

describe('parsers de entrada HTTP', () => {
  describe('asBody', () => {
    it('devuelve el objeto recibido', () => {
      expect(asBody({ a: 1 })).toEqual({ a: 1 });
    });
    it('devuelve {} si no es un objeto (null, lista, texto, undefined)', () => {
      expect(asBody(null)).toEqual({});
      expect(asBody([1, 2])).toEqual({});
      expect(asBody('hola')).toEqual({});
      expect(asBody(undefined)).toEqual({});
    });
  });

  describe('reqString', () => {
    it('devuelve el texto sin espacios sobrantes', () => {
      expect(reqString({ name: '  Ana  ' }, 'name')).toBe('Ana');
    });
    it('rechaza vacío, solo espacios, números y ausentes', () => {
      expect(() => reqString({ name: '' }, 'name')).toThrow(ValidationError);
      expect(() => reqString({ name: '   ' }, 'name')).toThrow(ValidationError);
      expect(() => reqString({ name: 5 }, 'name')).toThrow(ValidationError);
      expect(() => reqString({}, 'name')).toThrow(ValidationError);
    });
    it('el mensaje de error nombra el campo', () => {
      expect(() => reqString({}, 'documentId')).toThrow('documentId');
    });
  });

  describe('optString', () => {
    it('devuelve undefined si falta o viene vacío', () => {
      expect(optString({}, 'x')).toBeUndefined();
      expect(optString({ x: '' }, 'x')).toBeUndefined();
      expect(optString({ x: null }, 'x')).toBeUndefined();
    });
    it('devuelve el texto recortado si existe', () => {
      expect(optString({ x: ' hola ' }, 'x')).toBe('hola');
    });
    it('rechaza valores que no son texto', () => {
      expect(() => optString({ x: 10 }, 'x')).toThrow(ValidationError);
    });
  });

  describe('reqNumber', () => {
    it('acepta números válidos', () => {
      expect(reqNumber({ n: 15000 }, 'n')).toBe(15000);
    });
    it('rechaza texto, NaN e infinitos', () => {
      expect(() => reqNumber({ n: '5' }, 'n')).toThrow(ValidationError);
      expect(() => reqNumber({ n: NaN }, 'n')).toThrow(ValidationError);
      expect(() => reqNumber({ n: Infinity }, 'n')).toThrow(ValidationError);
    });
    it('respeta el mínimo', () => {
      expect(() => reqNumber({ n: -1 }, 'n', { min: 0 })).toThrow(ValidationError);
      expect(reqNumber({ n: 0 }, 'n', { min: 0 })).toBe(0);
    });
    it('exige enteros cuando se pide', () => {
      expect(() => reqNumber({ n: 1.5 }, 'n', { integer: true })).toThrow(ValidationError);
      expect(reqNumber({ n: 2 }, 'n', { integer: true })).toBe(2);
    });
  });

  describe('reqBoolean', () => {
    it('acepta true y false', () => {
      expect(reqBoolean({ ok: true }, 'ok')).toBe(true);
      expect(reqBoolean({ ok: false }, 'ok')).toBe(false);
    });
    it('rechaza texto como "true"', () => {
      expect(() => reqBoolean({ ok: 'true' }, 'ok')).toThrow(ValidationError);
    });
  });

  describe('reqEnum / optEnum', () => {
    const allowed = ['A', 'B'] as const;
    it('acepta un valor permitido', () => {
      expect(reqEnum({ v: 'A' }, 'v', allowed)).toBe('A');
    });
    it('rechaza un valor fuera de la lista y lo informa', () => {
      expect(() => reqEnum({ v: 'Z' }, 'v', allowed)).toThrow('A, B');
    });
    it('optEnum devuelve undefined si no viene, pero valida si viene', () => {
      expect(optEnum({}, 'v', allowed)).toBeUndefined();
      expect(optEnum({ v: 'B' }, 'v', allowed)).toBe('B');
      expect(() => optEnum({ v: 'Z' }, 'v', allowed)).toThrow(ValidationError);
    });
  });

  describe('reqParts', () => {
    it('sin "parts" devuelve una lista vacía', () => {
      expect(reqParts({})).toEqual([]);
    });
    it('devuelve los repuestos válidos', () => {
      expect(reqParts({ parts: [{ sku: ' SSD-240 ', quantity: 2 }] })).toEqual([{ sku: 'SSD-240', quantity: 2 }]);
    });
    it('rechaza si no es una lista', () => {
      expect(() => reqParts({ parts: 'x' })).toThrow(ValidationError);
    });
    it('rechaza cantidades cero, negativas o decimales', () => {
      expect(() => reqParts({ parts: [{ sku: 'A', quantity: 0 }] })).toThrow(ValidationError);
      expect(() => reqParts({ parts: [{ sku: 'A', quantity: -1 }] })).toThrow(ValidationError);
      expect(() => reqParts({ parts: [{ sku: 'A', quantity: 1.5 }] })).toThrow(ValidationError);
    });
    it('rechaza un repuesto sin sku', () => {
      expect(() => reqParts({ parts: [{ quantity: 1 }] })).toThrow(ValidationError);
    });
  });
});
