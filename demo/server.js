'use strict';

const http = require('node:http');
const { createHash, randomUUID, timingSafeEqual } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { openStore, RequestError, transitions } = require('./store');

const root = path.resolve(__dirname, '..');
const publicDirs = new Set(['care-assets', 'catalog-assets', 'category-assets', 'demo-products', 'dress-assets', 'shoe-assets', 'showcase-photos']);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'
};
const adminOrder = order => ({ ...order, allowedStatuses: [order.status, ...transitions[order.status]] });
const digest = value => createHash('sha256').update(value).digest();

function createServer({ database, adminPassword, publicOrigin }) {
  if (typeof adminPassword !== 'string' || adminPassword.length < 16) {
    throw new Error('AYMELEK_ADMIN_PASSWORD en az 16 karakter olmalı.');
  }
  const origin = publicOrigin ? new URL(publicOrigin).origin : null;
  const secure = origin?.startsWith('https:');
  const adminDigest = digest('Basic ' + Buffer.from('admin:' + adminPassword).toString('base64'));
  const store = openStore(database);

  function requireAdmin(req, res) {
    if (timingSafeEqual(adminDigest, digest(req.headers.authorization || ''))) return;
    res.setHeader('WWW-Authenticate', 'Basic realm="AYMELEK Demo", charset="UTF-8"');
    throw new RequestError(401, 'Yönetici girişi gerekli.');
  }

  function send(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  }

  function buyer(req, res, create = false) {
    const found = (req.headers.cookie || '').match(/(?:^|;\s*)aymelek_demo=([a-f0-9-]{36})(?:;|$)/);
    if (found) return found[1];
    if (!create) throw new RequestError(400, 'Ödeme oturumu bulunamadı. Sayfayı yenileyin.');
    const id = randomUUID();
    res.setHeader('Set-Cookie', 'aymelek_demo=' + id + '; Path=/; HttpOnly; SameSite=Strict' + (secure ? '; Secure' : ''));
    return id;
  }

  async function readJSON(req, limit = 64 * 1024) {
    const allowedOrigin = origin || 'http://' + req.headers.host;
    if (req.headers.origin !== allowedOrigin || req.headers['sec-fetch-site'] === 'cross-site') {
      throw new RequestError(403, 'İstek kaynağı doğrulanamadı.');
    }
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
      throw new RequestError(415, 'JSON istek gövdesi gerekli.');
    }
    if (+req.headers['content-length'] > limit) throw new RequestError(413, 'İstek çok büyük.');
    const chunks = [];
    let size = 0;
    for await (const chunk of req.iterator({ destroyOnReturn: false })) {
      size += chunk.length;
      if (size > limit) {
        req.resume();
        throw new RequestError(413, 'İstek çok büyük.');
      }
      chunks.push(chunk);
    }
    try {
      const data = JSON.parse(Buffer.concat(chunks));
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
      return data;
    } catch {
      throw new RequestError(400, 'Geçersiz JSON.');
    }
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      const method = req.method;

      if (pathname.startsWith('/api/admin/')) requireAdmin(req, res);
      if (pathname === '/api/catalog' && method === 'GET') return send(res, store.getCatalog());
      if (pathname === '/api/quote' && method === 'POST') {
        const { rows } = await readJSON(req);
        const summary = store.getQuote(rows);
        buyer(req, res, true);
        return send(res, { ...summary, addresses: store.addressOptions });
      }
      if (pathname === '/api/checkout' && method === 'POST') {
        const session = buyer(req, res);
        const body = await readJSON(req);
        return send(res, store.checkout(session, body));
      }
      if (pathname === '/api/receipt' && method === 'GET') {
        const order = store.receipt(buyer(req, res), url.searchParams.get('attempt') || '');
        if (!order) throw new RequestError(404, 'Sipariş bulunamadı.');
        return send(res, order);
      }
      if (pathname === '/api/admin/orders' && method === 'GET') return send(res, store.listOrders().map(adminOrder));
      const order = pathname.match(/^\/api\/admin\/orders\/([a-f0-9-]{36})$/);
      if (order && method === 'PATCH') {
        const { status } = await readJSON(req);
        return send(res, adminOrder(store.changeOrder(order[1], status)));
      }
      if (pathname === '/api/admin/catalog' && method === 'PUT') {
        const { products, revision } = await readJSON(req, 24 * 1024 * 1024);
        return send(res, store.replaceCatalog(products, revision));
      }

      const file = pathname === '/' ? 'index.html' : pathname.slice(1);
      const parts = file.split('/');
      const type = types[path.extname(file)];
      const publicFile = parts.every(part => /^[\w.-]+$/.test(part) && !part.startsWith('.')) &&
        (parts.length === 1 || (parts.length === 2 && publicDirs.has(parts[0])));
      if (!type || !publicFile || !['GET', 'HEAD'].includes(method)) throw new RequestError(404, 'Sayfa bulunamadı.');
      if (file === 'admin.html' || file === 'admin.js') requireAdmin(req, res);
      const diskPath = path.join(root, file);
      if (!fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) throw new RequestError(404, 'Sayfa bulunamadı.');
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      if (method === 'HEAD') return res.end();
      fs.createReadStream(diskPath).pipe(res);
    } catch (error) {
      if (!(error instanceof RequestError) && !(error instanceof URIError)) console.error(error);
      send(res, { message: error instanceof RequestError ? error.message : 'İstek tamamlanamadı.' }, error.status || (error instanceof URIError ? 400 : 500));
    }
  });
  server.on('close', () => store.close());
  return server;
}

if (require.main === module) {
  const password = process.env.AYMELEK_ADMIN_PASSWORD;
  const database = path.resolve(process.env.AYMELEK_DEMO_DB || '.demo-data/store.sqlite');
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 4173);
  if (!password || password.length < 16) {
    console.error('AYMELEK_ADMIN_PASSWORD için en az 16 karakterlik bir parola belirleyin.');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(database), { recursive: true, mode: 0o700 });
  createServer({ database, adminPassword: password, publicOrigin: process.env.AYMELEK_PUBLIC_ORIGIN }).listen(port, host, () => {
    console.log('AYMELEK demo · http://' + host + ':' + port);
  });
}

module.exports = { createServer };
