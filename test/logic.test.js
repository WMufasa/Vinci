const test = require('node:test');
const assert = require('node:assert');
const L = require('../public/logic.js');

const near = (a, b, eps = 0.005) => assert.ok(Math.abs(a - b) < eps, a + ' vs ' + b);

test('geometric mean of 1.45, 2.18 and 2.30 is 1.94 (from the handoff)', () => {
  near(L.geoMean([1.45, 2.18, 2.30]), 1.94);
});

test('multiple is symmetric and 1 is perfect', () => {
  assert.strictEqual(L.multiple(10, 10), 1);
  assert.strictEqual(L.multiple(20, 10), 2);
  assert.strictEqual(L.multiple(5, 10), 2);
});

test('verdict bands', () => {
  assert.strictEqual(L.verdict(1.5).cls, 'good');
  assert.strictEqual(L.verdict(5).cls, 'warn');
  assert.strictEqual(L.verdict(5.01).cls, 'bad');
  assert.strictEqual(L.verdict(1.05).label, 'Bullseye');
});

test('parser accepts the documented formats', () => {
  assert.strictEqual(L.evaluate('2.5b'), 2.5e9);
  assert.strictEqual(L.evaluate('350 million'), 350e6);
  assert.strictEqual(L.evaluate('8*365*1e6'), 8 * 365 * 1e6);
  assert.strictEqual(L.evaluate('1,245'), 1245);
  assert.strictEqual(L.evaluate('(2+3)^2'), 25);
  assert.strictEqual(L.evaluate('abc'), null);
  assert.strictEqual(L.evaluate('1/0'), null);
});
