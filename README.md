# AYMELEK Demo Mağaza

Mevcut AYMELEK arayüzünü, defileyi ve 3D sunumları kullanır. Ödeme sayfasında iki kurmaca teslimat adresi ve başarılı, başarısız, iptal senaryoları bulunur. Başarısız veya iptal edilmiş ödeme yeniden denenebilir. Başarılı denemede sipariş kaydedilir ve stok güncellenir. Ödeme sağlayıcısı, kart alanı ve gerçek para hareketi yoktur.

## Yerelde başlatma

Node.js 22.13 veya üzeri gerekir. Uygulama, Node.js'in yerleşik HTTP ve SQLite modüllerini kullanır.

```bash
read -rs -p "Demo yönetici parolası (en az 16 karakter): " AYMELEK_ADMIN_PASSWORD
export AYMELEK_ADMIN_PASSWORD
npm start
```

- Mağaza [http://127.0.0.1:4173](http://127.0.0.1:4173)
- Yönetim [http://127.0.0.1:4173/admin.html](http://127.0.0.1:4173/admin.html). Tarayıcıdaki HTTP giriş penceresinde kullanıcı adı `admin`, parola yukarıdaki değerdir.
- Siparişler ve demo kataloğu varsayılan olarak `.demo-data/store.sqlite` altında saklanır. Ayrı bir demo örneği için `AYMELEK_DEMO_DB` ile yeni bir dosya yolu verilebilir. Favoriler ve sepet tarayıcıda kalır.
- Yönetim panelinde sipariş durumları, raporlar ve katalog düzenlemeleri kullanılabilir. İptal veya iade sırasında uygulama stok iadesini bir kez yapar. Aynı bedenin renkleri, mevcut katalog modeli uyarınca beden stoğunu paylaşır.

Bu dalın ödeme ve yönetim akışları Node sunucusu ile çalışır. GitHub Pages gibi statik barındırma bu sunucuyu çalıştırmaz. Yerel sunucu varsayılan olarak yalnızca loopback üzerinde dinler. Bir kurulum daha sonra paylaşılırsa yönetim parolası ağda açık taşınmasın diye HTTPS ters proxy kullanın ve `AYMELEK_PUBLIC_ORIGIN` değerini dış HTTPS kökenine ayarlayın.

## Testler

```bash
npm test
npm ci
npx playwright install chromium
npm run test:browser
```

Kurulu bir Chromium ile çalıştırmak için `CHROMIUM_PATH` ortam değişkenini belirtin. Testler bellekte ayrı bir SQLite veritabanı kullanır ve tarayıcı testi dış görsel ve font isteklerini engeller.

## Ödeme modülü

`demo/payment.js` simülasyon kararını verir. `demo/store.js` teslimat test verisini, sunucuda hesaplanan tutarı, ödeme denemesi kimliğini ve sipariş/stok işlemini yönetir. Gelecekte gerçek sağlayıcı eklenirse doğrulanmış sunucu bildirimleri ve ödeme durumları için ayrı bir entegrasyon gerekir. Demo kayıtları gerçek ödeme akışına aktarılmaz.
