import { describe, it, expect } from 'bun:test';
import { deliveryCharge } from './delivery';

describe('country-specific delivery pricing', () => {
  const rates = [
    { country_code: 'US', country_name: 'United States', amount: 1250, free_above: null },
    { country_code: 'IN', country_name: 'India', amount: 150, free_above: 3000 },
    { country_code: '*', country_name: 'Other countries', amount: 2500, free_above: null },
  ];
  it('uses the admin country rate instead of the international fallback', () => expect(deliveryCharge(rates, 'US', 5000)).toBe(1250));
  it('uses the admin fallback for countries without overrides', () => expect(deliveryCharge(rates, 'GB', 5000)).toBe(2500));
  it('uses the admin domestic rate', () => expect(deliveryCharge(rates, 'IN', 3000)).toBe(150));
  it('waives delivery only above the admin threshold', () => expect(deliveryCharge(rates, 'IN', 3001)).toBe(0));
  it('preserves international pricing until configured', () => expect(deliveryCharge([], 'US', 5000)).toBe(4000));
  it('preserves domestic pricing until configured', () => expect(deliveryCharge([], 'IN', 2000)).toBe(200));
});