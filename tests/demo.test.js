'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { test } = require('node:test');
const { openStore } = require('../demo/store');
const { createServer } = require('../demo/server');

function pick(catalog) {
  const product = catalog.find(item => item.avail && item.colors.length > 1);
  const size = product.sizes.find(size => product.stock[size] > 0);
  return { product, row: { id: product.id, size, color: product.colors[0][0], qty: 1 } };
}

test('failure and cancellation preserve stock, retry creates one order, cancellation restores stock once', () => {
  const store = openStore(':memory:');
  try {
    const { product, row } = pick(store.getCatalog().products);
    const summary = store.getQuote([row]);
    const attempt = { rows: [row], expectedTotal: summary.total, addressId: 'istanbul', attempt: randomUUID() };
    assert.equal(summary.shipping, summary.subtotal >= 5000 ? 0 : 245);
    for (const scenario of ['failure', 'cancel']) {
      assert.equal(store.checkout('buyer', { ...attempt, scenario }).outcome, scenario);
      assert.equal(store.listOrders().length, 0);
      assert.equal(store.getCatalog().revision, 0);
    }
    const paid = store.checkout('buyer', { ...attempt, scenario: 'success' });
    assert.equal(store.checkout('buyer', { ...attempt, scenario: 'success' }).order.id, paid.order.id);
    assert.equal(store.listOrders().length, 1);
    assert.equal(store.receipt('other-buyer', attempt.attempt), null);
    assert.throws(() => store.checkout('buyer', { ...attempt, addressId: 'izmir', scenario: 'success' }), { status: 409 });
    const available = () => store.getCatalog().products.find(item => item.id === row.id).stock[row.size];
    assert.equal(available(), product.stock[row.size] - 1);
    assert.throws(() => store.changeOrder(paid.order.id, 'teslim'), { status: 409 });
    store.changeOrder(paid.order.id, 'hazirlaniyor');
    store.changeOrder(paid.order.id, 'iptal');
    store.changeOrder(paid.order.id, 'iptal');
    assert.equal(available(), product.stock[row.size]);
    assert.throws(() => store.changeOrder(paid.order.id, 'beklemede'), { status: 409 });
  } finally { store.close(); }
});

test('same-size stock is shared across colors and stale order and catalog changes are rejected', () => {
  const store = openStore(':memory:');
  try {
    const { product, row } = pick(store.getCatalog().products);
    const original = store.getCatalog();
    const finalUnits = { ...row, qty: product.stock[row.size] };
    assert.throws(() => store.getQuote([finalUnits, { ...row, color: product.colors[1][0] }]), { status: 409 });
    assert.throws(() => store.getQuote([{ ...row, color: 'Geçersiz' }]), { status: 409 });
    const expectedTotal = store.getQuote([finalUnits]).total;
    const request = { rows: [finalUnits], expectedTotal, addressId: 'izmir', scenario: 'success' };
    assert.throws(() => store.checkout('one', { ...request, expectedTotal: 1, attempt: randomUUID() }), { status: 409 });
    store.checkout('one', { ...request, attempt: randomUUID() });
    assert.throws(() => store.checkout('two', { ...request, attempt: randomUUID() }), { status: 409 });
    assert.throws(() => store.replaceCatalog(original.products, original.revision), { status: 409 });
    assert.equal(store.listOrders().length, 1);
  } finally { store.close(); }
});

test('admin routes require server credentials and reject cross-origin changes', async () => {
  const password = 'regression-admin-password-123';
  const auth = 'Basic ' + Buffer.from('admin:' + password).toString('base64');
  const server = createServer({ database: ':memory:', adminPassword: password });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const route of ['/admin.html', '/admin.js', '/api/admin/orders']) {
      assert.equal((await fetch(origin + route)).status, 401);
      assert.equal((await fetch(origin + route, { headers: { Authorization: auth } })).status, 200);
    }
    const catalog = await (await fetch(origin + '/api/catalog')).json();
    const { row } = pick(catalog.products);
    const quoted = await fetch(origin + '/api/quote', {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: [row] })
    });
    const cookie = quoted.headers.get('set-cookie').split(';')[0];
    const summary = await quoted.json();
    const request = {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ rows: [row], expectedTotal: summary.total, addressId: 'istanbul', scenario: 'success', attempt: randomUUID() })
    };
    const submitted = await Promise.all([fetch(origin + '/api/checkout', request), fetch(origin + '/api/checkout', request)]);
    const [first, second] = await Promise.all(submitted.map(response => response.json()));
    assert.equal(first.order.id, second.order.id);
    const orders = await (await fetch(origin + '/api/admin/orders', { headers: { Authorization: auth } })).json();
    assert.equal(orders.length, 1);
    const cross = await fetch(origin + '/api/admin/orders/' + first.order.id, {
      method: 'PATCH', headers: { Authorization: auth, Origin: 'https://example.org', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'iptal' })
    });
    assert.equal(cross.status, 403);
    assert.equal((await fetch(origin + '/demo/server.js')).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
