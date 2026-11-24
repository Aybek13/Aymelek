'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const { chromium } = require('playwright');
const { createServer } = require('../demo/server');

test('mobile, tablet and desktop demo journeys', async t => {
  const password = 'regression-admin-password-123';
  const server = createServer({ database: ':memory:', adminPassword: password });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  t.after(() => browser.close());
  for (const width of [375, 768, 1440]) {
    await t.test(width + ' px', async () => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin);
        await page.locator('.demo-notice').waitFor();
        const count = await page.locator('#counter').textContent();
        await page.locator('#next').click();
        assert.notEqual(await page.locator('#counter').textContent(), count);

        await page.goto(origin + '/product.html?id=41');
        await page.getByRole('button', { name: '3D görünüm' }).click();
        await page.locator('#bc').waitFor();
        assert.ok(await page.locator('#bc').evaluate(canvas => canvas.width > 0));
        await page.goto(origin + '/products.html?q=IPEK');
        await page.locator('.pc').first().waitFor();
        if (await page.locator('#fb').isVisible()) await page.locator('#fb').click();
        await page.locator('input[name=av]').check();
        if (await page.locator('#fx').isVisible()) await page.keyboard.press('Escape');
        await page.locator('#so').selectOption('asc');
        assert.match(page.url(), /sort=asc/);
        await page.reload();
        await page.locator('.pc').first().waitFor();
        assert.equal(await page.locator('#so').inputValue(), 'asc');
        assert.equal(await page.locator('input[name=av]').isChecked(), true);
        await page.locator('.pc [data-w]').first().click();
        await page.goto(origin + '/wishlist.html');
        await page.locator('.pc').first().waitFor();
        assert.equal(await page.locator('.pc').count(), 1);
        await page.goto(origin + '/product.html?id=103');
        await page.locator('#add').waitFor();
        for (const name of ['sz', 'co']) {
          const option = page.locator('input[name=' + name + ']:not(:disabled)').first();
          await option.evaluate(element => { if (!element.checked) element.click(); });
        }
        await page.locator('#add').click();
        await page.getByRole('link', { name: 'Sepeti görüntüle' }).click();
        await page.locator('.ln').waitFor();
        const actualCart = await page.evaluate(() => JSON.parse(localStorage.getItem('aymelek_cart')));
        await page.evaluate(rows => localStorage.setItem('aymelek_cart', JSON.stringify([{ id: -1, qty: 1 }, ...rows])), actualCart);
        await page.reload();
        await page.getByRole('button', { name: 'Kaldır', exact: true }).click();
        await page.getByText('Sepetiniz boş.').waitFor();
        await page.evaluate(rows => localStorage.setItem('aymelek_cart', JSON.stringify(rows)), actualCart);
        await page.reload();

        await page.locator('#co').click();
        await page.locator('#pay').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await page.locator('#address').selectOption('izmir');
        assert.match(await page.locator('#address-detail').textContent(), /İzmir/);
        for (const scenario of ['failure', 'cancel']) {
          await page.locator('#scenario').selectOption(scenario);
          await page.locator('#pay').click();
          await page.locator('#checkout-message').filter({ hasText: scenario === 'failure' ? /başarısız/ : /iptal/ }).waitFor();
          assert.equal(await page.locator('#pay').textContent(), 'Tekrar dene');
        }
        await page.locator('#scenario').selectOption('success');
        if (width === 375) {
          await page.route('**/api/checkout', async route => {
            const response = await route.fetch();
            assert.equal(response.status(), 200);
            await route.abort();
          }, { times: 1 });
        }
        await page.locator('#pay').click();
        if (width === 375) {
          await page.locator('#checkout-message').filter({ hasText: /ulaşılamadı/ }).waitFor();
          await page.reload();
        }
        await page.locator('#receipt-title').waitFor();
        const order = await page.locator('#receipt-number').textContent();
        await page.reload();
        await page.locator('#receipt-title').waitFor();
        assert.equal(await page.locator('#receipt-number').textContent(), order);
        assert.equal(await page.evaluate(() => localStorage.getItem('aymelek_cart')), null);

        const admin = await browser.newContext({ httpCredentials: { username: 'admin', password }, viewport: { width, height: 900 } });
        try {
          await admin.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
          const panel = await admin.newPage();
          await panel.goto(origin + '/admin.html');
          await panel.getByText('Düşük stok ve tükenenler', { exact: true }).waitFor();
          await panel.getByRole('button', { name: 'SİPARİŞLER', exact: true }).click();
          const orderId = order.split(': ')[1];
          const status = panel.locator('[data-os="' + orderId + '"]');
          await status.selectOption('hazirlaniyor');
          await panel.getByText('Demo sipariş durumu güncellendi.').waitFor();
          await panel.reload();
          await panel.getByText('Düşük stok ve tükenenler', { exact: true }).waitFor();
          await panel.getByRole('button', { name: 'SİPARİŞLER', exact: true }).click();
          await status.waitFor();
          assert.equal(await status.inputValue(), 'hazirlaniyor');
          if (width === 1440) {
            await panel.getByRole('button', { name: 'ÜRÜNLER', exact: true }).click();
            await panel.locator('[data-e="103"]').click();
            await panel.locator('#f_name').fill('Demo Pudra Saten Midi Elbise');
            await panel.locator('#sv').click();
            await panel.getByText('Ürün demo mağazasında güncellendi.', { exact: true }).waitFor();
            await page.goto(origin + '/product.html?id=103');
            await page.getByRole('heading', { name: 'Demo Pudra Saten Midi Elbise', exact: true }).waitFor();
          }
        } finally { await admin.close(); }
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    });
  }
});
