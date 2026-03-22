import { Decimal } from '@prisma/client/runtime/library';

import { GstService } from './gst.service';

describe('GstService', () => {
  let svc: GstService;

  beforeEach(() => {
    svc = new GstService({} as any);
  });

  it('splits intra-state tax into CGST and SGST', () => {
    const split = svc.computeTaxSplit({
      companyStateCode: '19',
      placeOfSupplyStateCode: '19',
      taxableValue: new Decimal('100.00'),
      taxRate: new Decimal('18.00'),
    });

    expect(split.isInterState).toBe(false);
    expect(split.cgstAmount.toString()).toBe('9');
    expect(split.sgstAmount.toString()).toBe('9');
    expect(split.igstAmount.toString()).toBe('0');
    expect(split.taxTotal.toString()).toBe('18');
  });

  it('routes inter-state tax fully to IGST', () => {
    const split = svc.computeTaxSplit({
      companyStateCode: '19',
      placeOfSupplyStateCode: '27',
      taxableValue: new Decimal('250.00'),
      taxRate: new Decimal('12.00'),
    });

    expect(split.isInterState).toBe(true);
    expect(split.cgstAmount.toString()).toBe('0');
    expect(split.sgstAmount.toString()).toBe('0');
    expect(split.igstAmount.toString()).toBe('30');
    expect(split.taxTotal.toString()).toBe('30');
  });

  it('returns zero tax amounts for zero-rated items', () => {
    const split = svc.computeTaxSplit({
      companyStateCode: '19',
      placeOfSupplyStateCode: '27',
      taxableValue: new Decimal('250.00'),
      taxRate: new Decimal('0.00'),
    });

    expect(split.isInterState).toBe(true);
    expect(split.cgstAmount.toString()).toBe('0');
    expect(split.sgstAmount.toString()).toBe('0');
    expect(split.igstAmount.toString()).toBe('0');
    expect(split.taxTotal.toString()).toBe('0');
  });
});
