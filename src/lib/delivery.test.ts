import { describe, it, expect } from 'vitest';

const assert = { equal: (a: unknown, b: unknown) => expect(a).toBe(b) };
import { deliveryCharge } from './delivery';

describe('country-specific delivery pricing', () => {
  const rates = [
    { country_code: 'US', country_name: 'United States', amount: 1250, free_above: null },
    { country_code: 'IN', country_name: 'India', amount: 150, free_above: 3000 },
    { country_code: '*', country_name: 'Other countries', amount: 2500, free_above: null },
  ];
  it('uses the admin country rate instead of the international fallback', () => assert.equal(deliveryCharge(rates, 'US', 5000), 1250));
  it('uses the admin fallback for countries without overrides', () => assert.equal(deliveryCharge(rates, 'GB', 5000), 2500));
  it('uses the admin domestic rate', () => assert.equal(deliveryCharge(rates, 'IN', 3000), 150));
  it('waives delivery only above the admin threshold', () => assert.equal(deliveryCharge(rates, 'IN', 3001), 0));
  it('preserves international pricing until configured', () => assert.equal(deliveryCharge([], 'US', 5000), 4000));
  it('preserves domestic pricing until configured', () => assert.equal(deliveryCharge([], 'IN', 2000), 200));
});