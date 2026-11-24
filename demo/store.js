'use strict';

const { DatabaseSync } = require('node:sqlite');
const { products, validateProduct, norm, FREE, SHIP } = require('../shop');
const { demoPayment } = require('./payment');
const { randomUUID } = require('node:crypto');

const addresses = {
  istanbul: { name: 'AYMELEK Test Alıcısı', city: 'İstanbul', address: 'Demo Mahallesi, Örnek Sokak No: 1', postal: '34000' },
  izmir: { name: 'AYMELEK Test Alıcısı', city: 'İzmir', address: 'Demo Mahallesi, Örnek Sokak No: 2', postal: '35000' }
};
const transitions = {
  beklemede: ['hazirlaniyor', 'iptal'],
  hazirlaniyor: ['kargoda', 'iptal'],
  kargoda: ['teslim'],
  teslim: ['iade_talebi'],
  iade_talebi: ['iade', 'teslim'],
  iptal: [],
  iade: []
};

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function cartItems(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) {
    throw new RequestError(400, 'Sepet boş veya geçersiz.');
  }
  const items = new Map();
  for (const row of rows) {
    if (!row || !Number.isSafeInteger(row.id) || !Number.isSafeInteger(row.qty) ||
        row.qty < 1 || row.qty > 1000 || typeof row.size !== 'string' ||
        typeof row.color !== 'string' || row.size.length > 40 || row.color.length > 80) {
      throw new RequestError(400, 'Sepette geçersiz ürün bilgisi var.');
    }
    const key = JSON.stringify([row.id, row.size, row.color]);
    const previous = items.get(key);
    items.set(key, { id: row.id, size: row.size, color: row.color, qty: row.qty + (previous?.qty || 0) });
  }
  return [...items.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item);
}

function quote(catalog, items) {
  const byId = new Map(catalog.map(product => [product.id, product]));
  const remaining = new Map();
  const lines = items.map(item => {
    const product = byId.get(item.id);
    if (!product || !product.avail || !product.sizes.includes(item.size) ||
        !product.colors.some(([name]) => name === item.color)) {
      throw new RequestError(409, 'Sepetteki bir ürün veya seçenek artık satışta değil.');
    }
    const key = JSON.stringify([item.id, item.size]);
    const available = (remaining.get(key) ?? product.stock[item.size]) - item.qty;
    if (available < 0) throw new RequestError(409, 'Yetersiz stok: ' + product.name);
    remaining.set(key, available);
    return { ...item, name: product.name, unit: product.price, total: product.price * item.qty };
  });
  const subtotal = lines.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal >= FREE ? 0 : SHIP;
  return { items: lines, subtotal, shipping, total: subtotal + shipping };
}

function updateStock(products, items, direction) {
  const byId = new Map(products.map(product => [product.id, product]));
  for (const item of items) {
    const product = byId.get(item.id);
    if (!product?.sizes.includes(item.size)) continue;
    product.stock[item.size] += item.qty * direction;
    product.avail = product.price > 0 && product.sizes.some(size => product.stock[size] > 0);
  }
}

function openStore(filename) {
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS catalog (id INTEGER PRIMARY KEY, revision INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, buyer TEXT NOT NULL, attempt TEXT NOT NULL, fingerprint TEXT NOT NULL,
      data TEXT NOT NULL, UNIQUE(buyer, attempt)
    );
  `);
  db.prepare('INSERT OR IGNORE INTO catalog VALUES (1, 0, ?)').run(JSON.stringify(products));
  const readCatalog = db.prepare('SELECT revision, data FROM catalog WHERE id = 1');
  const writeCatalog = db.prepare('UPDATE catalog SET revision = revision + 1, data = ? WHERE id = 1');
  const getCatalog = () => {
    const row = readCatalog.get();
    return { revision: row.revision, products: JSON.parse(row.data) };
  };
  function transaction(work) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    close: () => db.close(),
    getCatalog,
    getQuote: rows => quote(getCatalog().products, cartItems(rows)),
    addressOptions: addresses,
    checkout(buyer, { rows, addressId, scenario, attempt, expectedTotal }) {
      const items = cartItems(rows);
      if (typeof addressId !== 'string' || !Object.hasOwn(addresses, addressId) ||
          typeof attempt !== 'string' || !/^[a-f0-9-]{36}$/.test(attempt) ||
          !Number.isSafeInteger(expectedTotal)) {
        throw new RequestError(400, 'Demo ödeme bilgileri geçersiz.');
      }
      const fingerprint = JSON.stringify([items, addressId, expectedTotal]);
      return transaction(() => {
        const existing = db.prepare('SELECT fingerprint, data FROM orders WHERE buyer = ? AND attempt = ?').get(buyer, attempt);
        if (existing) {
          if (existing.fingerprint !== fingerprint) throw new RequestError(409, 'Bu ödeme denemesi farklı bir sepete ait.');
          return { outcome: 'success', order: JSON.parse(existing.data) };
        }

        const catalog = getCatalog().products;
        const summary = quote(catalog, items);
        if (summary.total !== expectedTotal) throw new RequestError(409, 'Sipariş tutarı değişti. Güncel özeti kontrol edin.');
        const { outcome } = demoPayment.authorize(scenario);
        if (outcome === 'invalid') throw new RequestError(400, 'Geçersiz ödeme senaryosu.');
        if (outcome !== 'success') return { outcome };

        const address = addresses[addressId];
        const order = { ...summary, ...address, id: randomUUID(), date: Date.now(), currency: 'TRY', pay: 'Demo ödeme', status: 'beklemede' };
        updateStock(catalog, items, -1);
        writeCatalog.run(JSON.stringify(catalog));
        db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)').run(order.id, buyer, attempt, fingerprint, JSON.stringify(order));
        return { outcome, order };
      });
    },
    receipt(buyer, attempt) {
      const row = db.prepare('SELECT data FROM orders WHERE buyer = ? AND attempt = ?').get(buyer, attempt);
      return row ? JSON.parse(row.data) : null;
    },
    listOrders() {
      return db.prepare('SELECT data FROM orders ORDER BY rowid DESC').all().map(row => JSON.parse(row.data));
    },
    changeOrder(id, status) {
      return transaction(() => {
        const row = db.prepare('SELECT data FROM orders WHERE id = ?').get(id);
        if (!row) throw new RequestError(404, 'Sipariş bulunamadı.');
        const order = JSON.parse(row.data);
        if (order.status === status) return order;
        if (!transitions[order.status].includes(status)) throw new RequestError(409, 'Bu durum değişikliği yapılamaz.');
        if (status === 'iptal' || status === 'iade') {
          const catalog = getCatalog().products;
          updateStock(catalog, order.items, 1);
          writeCatalog.run(JSON.stringify(catalog));
        }
        order.status = status;
        db.prepare('UPDATE orders SET data = ? WHERE id = ?').run(JSON.stringify(order), id);
        return order;
      });
    },
    replaceCatalog(list, revision) {
      if (!Array.isArray(list) || list.length > 250 || !list.every(validateProduct) ||
          new Set(list.map(product => Number(product.id))).size !== list.length ||
          list.some(product => product.orig > 1000000 || !Number.isInteger(product.disc) || product.disc < 0 || product.disc > 90)) {
        throw new RequestError(400, 'Katalog verileri geçersiz.');
      }
      return transaction(() => {
        if (revision !== getCatalog().revision) throw new RequestError(409, 'Katalog veya stok değişti. Sayfayı yenileyip tekrar deneyin.');
        const normalized = list.map(norm);
        for (const order of this.listOrders()) {
          if (['iptal', 'iade'].includes(order.status)) continue;
          for (const item of order.items) {
            const product = normalized.find(candidate => candidate.id === item.id);
            if (!product?.sizes.includes(item.size)) {
              throw new RequestError(409, 'Siparişe bağlı bir ürün veya beden kaldırılamaz.');
            }
          }
        }
        writeCatalog.run(JSON.stringify(normalized));
        return getCatalog();
      });
    }
  };
}

module.exports = { openStore, RequestError, transitions };
