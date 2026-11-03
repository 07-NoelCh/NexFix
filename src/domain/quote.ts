import type { QuoteLine } from './types';

export function calculateQuoteTotal(laborCost: number, lines: readonly QuoteLine[]): number {
  return laborCost + lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
