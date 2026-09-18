import test from 'node:test';
import assert from 'node:assert/strict';
import { totalCents } from './cart.mjs';
test('uses quantity when calculating the order total', () => {
  assert.equal(totalCents([{priceCents:125,quantity:3},{priceCents:50,quantity:2}]),475);
});
test('empty cart has zero total', () => {
  assert.equal(totalCents([]),0);
});
