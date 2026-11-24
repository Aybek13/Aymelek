'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const cartKey = 'aymelek_cart';
  const pendingKey = 'aymelek_demo_pending';
  const receiptKey = 'aymelek_demo_receipt';
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
  const message = text => { $('checkout-message').textContent = text; };
  let rows, summary;

  function cart() {
    try {
      const data = JSON.parse(localStorage.getItem(cartKey));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async function api(path, body) {
    const options = body === undefined ? { cache: 'no-store' } : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    };
    const response = await fetch(path, options).catch(() => {
      throw new Error('Demo sunucusuna ulaşılamadı. Tekrar deneyebilirsiniz.');
    });
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      throw new Error('Demo ödeme sunucusu kullanılamıyor.');
    }
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function confirm(order, pending) {
    sessionStorage.setItem(receiptKey, pending.attempt);
    sessionStorage.removeItem(pendingKey);
    if (pending.cart && JSON.stringify(cart()) === pending.cart) localStorage.removeItem(cartKey);
    window.dispatchEvent(new Event('storage'));
    $('checkout-layout').hidden = true;
    $('retry-quote').hidden = true;
    $('receipt-number').textContent = 'Sipariş numarası: ' + order.id;
    $('receipt-details').textContent = order.city + ' · ' + money.format(order.total) + ' · Demo ödeme';
    $('receipt').hidden = false;
    message('');
    $('receipt-title').focus();
  }

  function showAddress() {
    const address = summary.addresses[$('address').value];
    $('address-detail').textContent = [address.name, address.address, address.postal + ' ' + address.city].join('\n');
  }

  async function refresh() {
    $('retry-quote').hidden = true;
    $('checkout-layout').hidden = true;
    try {
      const pending = JSON.parse(sessionStorage.getItem(pendingKey));
      const savedReceipt = sessionStorage.getItem(receiptKey);
      const candidate = pending || (!cart().length && savedReceipt ? { attempt: savedReceipt } : null);
      if (candidate) {
        try {
          confirm(await api('api/receipt?attempt=' + encodeURIComponent(candidate.attempt)), candidate);
          return;
        } catch (error) {
          if (![400, 404].includes(error.status)) throw error;
        }
      }
      const snapshot = cart();
      if (!snapshot.length) {
        message('Sepetiniz boş. Demo sipariş için bir ürün ekleyin.');
        return;
      }
      rows = snapshot.map(({ id, size, color, qty }) => ({ id: Number(id), size, color, qty: Number(qty) }));
      summary = await api('api/quote', { rows });
      const previousAddress = $('address').value;
      $('address').replaceChildren(...Object.entries(summary.addresses).map(([id, address]) => new Option(address.city, id)));
      if (summary.addresses[previousAddress]) $('address').value = previousAddress;
      showAddress();
      $('checkout-items').replaceChildren(...summary.items.map(item => {
        const line = document.createElement('li');
        line.textContent = item.name + ' · ' + item.size + ' · ' + item.color + ' × ' + item.qty + ' · ' + money.format(item.total);
        return line;
      }));
      $('subtotal').textContent = money.format(summary.subtotal);
      $('shipping').textContent = summary.shipping ? money.format(summary.shipping) : 'Ücretsiz';
      $('total').textContent = money.format(summary.total);
      $('checkout-layout').hidden = false;
      message('');
    } catch (error) {
      message(error.message);
      $('retry-quote').hidden = false;
    }
  }

  function checkoutAttempt(fingerprint) {
    const key = 'aymelek_demo_attempt';
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved?.fingerprint === fingerprint) return saved.attempt;
    const attempt = crypto.randomUUID();
    localStorage.setItem(key, JSON.stringify({ fingerprint, attempt }));
    return attempt;
  }

  $('checkout-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('pay');
    if (button.disabled) return;
    button.disabled = true;
    message('Demo ödeme işleniyor…');
    try {
      const snapshot = JSON.stringify(cart());
      const current = cart().map(({ id, size, color, qty }) => ({ id: Number(id), size, color, qty: Number(qty) }));
      if (JSON.stringify(current) !== JSON.stringify(rows)) {
        await refresh();
        message('Sepet değişti. Güncel sipariş özetini kontrol edin.');
        return;
      }
      const addressId = $('address').value;
      const fingerprint = snapshot;
      const makeAttempt = () => checkoutAttempt(fingerprint);
      const attempt = navigator.locks ? await navigator.locks.request('aymelek-checkout', makeAttempt) : makeAttempt();
      const pending = { attempt, cart: snapshot };
      sessionStorage.setItem(pendingKey, JSON.stringify(pending));
      const result = await api('api/checkout', {
        rows, addressId, attempt, expectedTotal: summary.total, scenario: $('scenario').value
      });
      if (result.outcome === 'success') {
        confirm(result.order, pending);
        return;
      }
      sessionStorage.removeItem(pendingKey);
      message(result.outcome === 'failure'
        ? 'Demo ödeme başarısız. Senaryoyu değiştirip tekrar deneyebilirsiniz.'
        : 'Demo ödeme iptal edildi. Sepetiniz hazır, tekrar deneyebilirsiniz.');
      button.textContent = 'Tekrar dene';
      $('checkout-message').focus();
    } catch (error) {
      if (error.status === 409) await refresh();
      message(error.message);
      $('checkout-message').focus();
    } finally {
      button.disabled = false;
    }
  });

  $('address').addEventListener('change', showAddress);
  $('retry-quote').addEventListener('click', refresh);
  refresh();
})();
