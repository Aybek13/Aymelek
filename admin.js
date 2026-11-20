(function(){
var COL=window.AYMELEK_COL,CN=window.AYMELEK_CN,KEY='aymelek_admin_draft',$=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var SZ={care:['30 ml','50 ml','100 ml','150 ml','200 ml'],shoes:['36','37','38','39','40','41'],bags:['Tek Beden'],accessories:['Tek Beden']};function sizesOf(c){return SZ[c]||['XS','S','M','L','XL']}
var list=[],tab='dash',edit=null,note='';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function f(n){return new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' TL'}
function price(p){return Math.round(p.orig*(100-p.disc)/100)}
function total(p){return Object.keys(p.stock).reduce(function(s,k){return s+p.stock[k]},0)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(list));try{localStorage.setItem('aymelek_showcase_six','1')}catch(e){}return true}catch(e){return false}}
function init(){var d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}
 if(Array.isArray(d)){list=window.AYMELEK_MERGE_SHOWCASE(d).map(window.AYMELEK_NORMALIZE_PRODUCT);note='Bu tarayıcıdaki demo kataloğu yüklendi.';draw();return}
 fetch('products.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(j){list=Array.isArray(j)&&j.length?j.map(window.AYMELEK_NORMALIZE_PRODUCT):JSON.parse(JSON.stringify(window.AYMELEK_DEFAULTS));note=Array.isArray(j)&&j.length?'Yayındaki products.json yüklendi.':'Örnek ürünler yüklendi (yayında products.json yok).'}).catch(function(){list=JSON.parse(JSON.stringify(window.AYMELEK_DEFAULTS));note='Örnek ürünler yüklendi.'}).then(draw)}
function img(p){return p.images&&p.images[0]?p.images[0]:'logo.png'}
function dash(){var units=0,val=0,out=[],low=[],dc=0,by={};list.forEach(function(p){var t=total(p);units+=t;val+=t*price(p);if(p.disc)dc++;by[p.cat]=(by[p.cat]||0)+1;if(t==0)out.push(p);else if(Object.keys(p.stock).some(function(k){return p.stock[k]>0&&p.stock[k]<=2}))low.push(p)});
 return'<div class="kp"><div><span>ÜRÜN</span><b>'+list.length+'</b></div><div><span>TOPLAM STOK</span><b>'+units+'</b></div><div><span>STOK DEĞERİ</span><b>'+f(val)+'</b></div><div><span>İNDİRİMLİ</span><b>'+dc+'</b></div><div><span>TÜKENEN</span><b class="'+(out.length?'low':'')+'">'+out.length+'</b></div></div>'+
 '<div class="card"><h3>Düşük stok ve tükenenler</h3>'+((low.length+out.length)?'<table class="tb">'+out.concat(low).map(function(p){return'<tr><td>'+esc(p.name)+'</td><td>'+(total(p)?'<span class="low">Az kaldı</span>':'<span class="low">Tükendi</span>')+'</td><td><button class="ab" data-e="'+p.id+'">Düzenle</button></td></tr>'}).join('')+'</table>':'<p>Düşük stoklu ürün yok.</p>')+'</div>'+
 '<div class="card"><h3>Kategorilere göre ürün</h3>'+Object.keys(CN).map(function(k){return CN[k]+': <b>'+(by[k]||0)+'</b>'}).join(' &nbsp;·&nbsp; ')+'</div>'+
 '<div class="card"><h3>Siparişler ve satışlar</h3><p style="color:#858085;font-size:14px"><b>Demo:</b> Sipariş, ciro ve iade ekranlarını üstteki <b>SİPARİŞLER</b> ve <b>RAPORLAR</b> sekmelerinde görebilirsiniz. Veriler örnektir; gerçek siparişler için veritabanı bağlantısı kurulacak.</p></div>'}
function prods(){
 var stockCount=list.reduce(function(sum,p){return sum+total(p)},0),out=list.filter(function(p){return total(p)<1}).length;
 var categories=Object.keys(CN).map(function(k){return '<option value="'+esc(k)+'">'+esc(CN[k])+'</option>'}).join('');
 var cards=list.map(function(p){
  var quantity=total(p),category=p.showcaseOrder?'3D Vitrin':(CN[p.cat]||p.cat);
  return '<article class="admin-product" data-n="'+esc(p.name.toLocaleLowerCase('tr'))+'" data-cat="'+esc(p.showcaseOrder?'showcase':p.cat)+'">'+
   '<img src="'+esc(img(p))+'" alt="" loading="lazy"><small>'+esc(category)+'</small><h2>'+esc(p.name)+'</h2>'+
   '<div>'+(p.disc?'<s>'+f(+p.orig)+'</s> ':'')+'<strong>'+f(price(p))+'</strong></div><small class="stock'+(quantity<1?' low':'')+'">'+(quantity<1?'Tükendi':'Stok: '+quantity)+'</small>'+
   '<div class="admin-actions"><button type="button" class="ab" data-e="'+esc(p.id)+'">Düzenle</button><button type="button" class="ab d" data-d="'+esc(p.id)+'">Sil</button></div></article>';
 }).join('');
 return (edit?form():'')+'<section class="card admin-catalog"><div class="admin-toolbar"><h1>Ürünler</h1><div class="admin-tools"><input id="sq" type="search" aria-label="Ürün ara" placeholder="Ürün ara…"><select id="admin-cat" aria-label="Kategori filtrele"><option value="">Tüm kategoriler</option>'+categories+'<option value="showcase">3D Vitrin</option></select><button type="button" class="ab pr" id="new">+ Yeni ürün</button></div></div>'+
 '<div class="admin-content"><div><div class="admin-grid">'+cards+'</div><p id="admin-empty" hidden>Bu filtreye uyan ürün yok.</p></div><aside class="admin-summary" aria-label="Stok özeti"><h2>Stok özeti</h2><dl><div><dt>Ürün</dt><dd>'+list.length+'</dd></div><div><dt>Toplam adet</dt><dd>'+stockCount+'</dd></div><div><dt>Tükenen</dt><dd>'+out+'</dd></div></dl></aside></div></section>';
}
function form(){var p=edit,sz=sizesOf(p.cat),cn=p.colors.map(function(c){return c[0]});
 return'<div class="card" id="fm"><h3>'+(p._new?'Yeni ürün':'Ürünü düzenle')+'</h3><div class="fg"><label>Ürün adı<input id="f_name" value="'+esc(p.name)+'"></label><label>Kategori<select id="f_cat">'+Object.keys(CN).map(function(k){return'<option value="'+k+'"'+(k===p.cat&&!p.showcaseOrder?' selected':'')+'>'+CN[k]+'</option>'}).join('')+'<option value="showcase"'+(p.showcaseOrder?' selected':'')+'>3D Vitrin</option></select></label>'+
 '<label>Marka<input id="f_brand" value="'+esc(p.brand)+'"></label><label>Fiyat (TL)<input id="f_orig" type="number" min="0" step="1" value="'+esc(p.orig)+'"></label><label>İndirim (%)<input id="f_disc" type="number" min="0" max="90" step="1" value="'+esc(p.disc)+'"></label><label>İndirimli fiyat<input value="'+f(price(p))+'" disabled></label>'+
 '<div class="w ck"><label style="color:#858085;font-size:12px;letter-spacing:.08em;display:block">RENKLER</label>'+COL.map(function(c){return'<label><input type="checkbox" name="fc" value="'+c[0]+'"'+(cn.indexOf(c[0])>-1?' checked':'')+'>'+c[0]+'</label>'}).join('')+'</div>'+
 '<div class="w"><label>STOK (beden başına adet)</label>'+sz.map(function(s){return'<span class="st">'+s+'<input type="number" min="0" data-s="'+s+'" value="'+(p.stock[s]||0)+'"></span>'}).join('')+'</div>'+
 '<div class="w ck"><label><input type="checkbox" id="f_new"'+(p.isNew?' checked':'')+'>Yeni gelen</label><label><input type="checkbox" id="f_best"'+(p.best?' checked':'')+'>Çok satan</label></div>'+
 '<div class="w"><label>Ürün fotoğrafları (isteğe bağlı)<input id="f_files" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><p>JPEG, PNG veya WebP. Fotoğraf eklenmezse örnek görsel kullanılır.</p><div id="f_photos" style="display:flex;gap:10px;flex-wrap:wrap"></div></div><label class="w">Açıklama<textarea id="f_desc" rows="3">'+esc(p.desc)+'</textarea></label><label class="w">Malzeme ve bakım<textarea id="f_mat" rows="2">'+esc(p.mat)+'</textarea></label></div><div id="fe" class="msg" role="alert"></div><button class="ab pr" id="sv">Kaydet</button><button class="ab" id="cx">Vazgeç</button></div>'}
function pub(){return'<div class="card"><h3>Demo kataloğu</h3><p>Ürünler ve fotoğraflar bu tarayıcıdaki mağazaya yansır.</p><a class="ab pr" href="products.html">Mağazayı aç</a> <button class="ab" id="dl">Katalog yedeğini indir</button> <label class="ab" style="display:inline-block;cursor:pointer">Yedek yükle<input id="im" type="file" accept="application/json" hidden></label> <button class="ab d" id="rs">Örnek ürünlere sıfırla</button></div>'}

var DK='aymelek_demo_orders',orders=[],per='day',of='';
var ST={beklemede:'Beklemede',hazirlaniyor:'Hazırlanıyor',kargoda:'Kargoda',teslim:'Teslim edildi',iptal:'İptal',iade_talebi:'İade talebi',iade:'İade edildi'};
var MON=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],MONF=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mkDemo(){var r=rng(2026),P=window.AYMELEK_DEFAULTS,fn=['Ayşe','Fatma','Elif','Zeynep','Merve','Selin','Büşra','Esra','Derya','Gizem','Seda','Aylin','Nazlı','Ceren','Sibel'],ln=['Yılmaz','Kaya','Demir','Çelik','Şahin','Aydın','Öztürk','Arslan','Doğan','Kılıç'],ct=['İstanbul','Ankara','İzmir','Bursa','Antalya','Kocaeli','Konya','Tekirdağ'],o=[],now=new Date();
 for(var i=0;i<140;i++){var da=Math.floor(Math.pow(r(),1.25)*100),d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-da,9+Math.floor(r()*12),Math.floor(r()*60)),n=1+Math.floor(r()*3),it=[],tot=0;
  for(var k=0;k<n;k++){var p=P[Math.floor(r()*P.length)],q=1+Math.floor(r()*2),u=Math.round(p.orig*(100-p.disc)/100);it.push({name:p.name,qty:q});tot+=u*q}
  var ship=tot>=5000?0:245,x=r(),s;
  if(da<=1)s=x<.5?'beklemede':x<.8?'hazirlaniyor':'kargoda';else if(da<=5)s=x<.15?'beklemede':x<.4?'hazirlaniyor':x<.7?'kargoda':'teslim';else s=x<.78?'teslim':x<.84?'iptal':x<.93?'iade':'iade_talebi';
  o.push({id:1000+140-i,date:d.getTime(),name:fn[Math.floor(r()*fn.length)]+' '+ln[Math.floor(r()*ln.length)],city:ct[Math.floor(r()*ct.length)],items:it,currency:'TRY',total:Math.round((tot+ship)*100)/100,pay:r()<.6?'Kapıda ödeme':'Havale',status:s})}
 return o.sort(function(a,b){return b.date-a.date})}
function loadDemo(){var d=null;try{d=JSON.parse(localStorage.getItem(DK))}catch(e){}orders=Array.isArray(d)&&d.length?d.map(function(o){return o.currency==='TRY'?o:Object.assign({},o,{total:o.total*50,currency:'TRY'})}):mkDemo()}
function saveDemo(){try{localStorage.setItem(DK,JSON.stringify(orders))}catch(e){}}
function good(o){return o.status!='iptal'&&o.status!='iade'&&o.status!='iade_talebi'}
function sod(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function mon(d){var x=sod(d),w=(x.getDay()+6)%7;x.setDate(x.getDate()-w);return x}
function sumRange(from){var r={rev:0,n:0,pend:0,ret:0,retAmt:0};orders.forEach(function(o){if(o.date<from)return;r.n++;if(good(o))r.rev+=o.total;if(o.status=='beklemede')r.pend++;if(o.status=='iade'||o.status=='iade_talebi'){r.ret++;r.retAmt+=o.total}});return r}
function banner(){return'<div class="warn"><b>DEMO — örnek veriler.</b> Bu sipariş, ciro ve iade rakamları gösterim amaçlı otomatik üretilmiştir; gerçek müşteri siparişi değildir. Gerçek siparişler için veritabanı bağlantısı kurulacak.</div>'}
function ordTab(){var list=orders.filter(function(o){return!of||o.status==of});
 return banner()+'<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px"><select id="of" style="padding:9px;border:1px solid #e6d6dc"><option value="">Tüm durumlar ('+orders.length+')</option>'+Object.keys(ST).map(function(k){return'<option value="'+k+'"'+(k==of?' selected':'')+'>'+ST[k]+' ('+orders.filter(function(o){return o.status==k}).length+')</option>'}).join('')+'</select><button class="ab d" id="rd">Demo verisini sıfırla</button></div><div style="overflow-x:auto"><table class="tb"><tr><th>No</th><th>Tarih</th><th>Müşteri</th><th>Ürünler</th><th>Ödeme</th><th>Tutar</th><th>Durum</th></tr>'+list.slice(0,60).map(function(o){var d=new Date(o.date);return'<tr><td>#'+o.id+'</td><td>'+d.getDate()+' '+MON[d.getMonth()]+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+'</td><td>'+esc(o.name)+'<br><small style="color:#858085">'+o.city+'</small></td><td style="max-width:240px">'+o.items.map(function(i){return esc(i.name)+' ×'+i.qty}).join(', ')+'</td><td>'+o.pay+'</td><td>'+f(o.total)+'</td><td><select data-os="'+o.id+'" style="padding:6px;border:1px solid #e6d6dc">'+Object.keys(ST).map(function(k){return'<option value="'+k+'"'+(k==o.status?' selected':'')+'>'+ST[k]+'</option>'}).join('')+'</select></td></tr>'}).join('')+'</table></div>'+(list.length>60?'<p style="font-size:13px;color:#858085;margin-top:10px">İlk 60 sipariş gösteriliyor.</p>':'')+'</div>'}
function buckets(){var now=new Date(),out=[],i,N=per=='day'?14:per=='week'?12:6;
 for(i=N-1;i>=0;i--){var a,b,l;if(per=='day'){a=sod(now);a.setDate(a.getDate()-i);b=new Date(a);b.setDate(b.getDate()+1);l=a.getDate()+' '+MON[a.getMonth()]}
  else if(per=='week'){a=mon(now);a.setDate(a.getDate()-7*i);b=new Date(a);b.setDate(b.getDate()+7);var e=new Date(b);e.setDate(e.getDate()-1);l=a.getDate()+(a.getMonth()!=e.getMonth()?' '+MON[a.getMonth()]:'')+'–'+e.getDate()+' '+MON[e.getMonth()]}
  else{a=new Date(now.getFullYear(),now.getMonth()-i,1);b=new Date(now.getFullYear(),now.getMonth()-i+1,1);l=MONF[a.getMonth()]+' '+a.getFullYear()}
  var r={l:l,rev:0,n:0,pend:0,ret:0,retAmt:0};orders.forEach(function(o){if(o.date>=a.getTime()&&o.date<b.getTime()){r.n++;if(good(o))r.rev+=o.total;if(o.status=='beklemede')r.pend++;if(o.status=='iade'||o.status=='iade_talebi'){r.ret++;r.retAmt+=o.total}}});out.push(r)}return out}
function repTab(){var now=new Date(),t=sumRange(sod(now).getTime()),w=sumRange(mon(now).getTime()),m=sumRange(new Date(now.getFullYear(),now.getMonth(),1).getTime()),bk=buckets(),mx=Math.max.apply(0,bk.map(function(b){return b.rev}).concat(1)),all=sumRange(0),pend=orders.filter(function(o){return o.status=='beklemede'}).length;
 function K(l,r){return'<div><span>'+l+'</span><b>'+f(r.rev)+'</b><small style="color:#858085">'+r.n+' sipariş</small></div>'}
 return banner()+'<div class="kp">'+K('BUGÜN CİRO',t)+K('BU HAFTA CİRO',w)+K('BU AY CİRO',m)+'<div><span>BEKLEYEN SİPARİŞ</span><b class="'+(pend?'low':'')+'">'+pend+'</b><small style="color:#858085">işlem bekliyor</small></div><div><span>İADELER</span><b>'+all.ret+'</b><small style="color:#858085">'+f(all.retAmt)+'</small></div></div>'+
 '<div class="card"><div style="display:flex;gap:6px;margin-bottom:16px">'+[['day','Günlük'],['week','Haftalık'],['month','Aylık']].map(function(x){return'<button class="ab'+(per==x[0]?' pr':'')+'" data-per="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div><div style="display:flex;align-items:flex-end;gap:'+(per=='day'?6:10)+'px;height:190px;border-bottom:1px solid #ecd9e0;padding-bottom:2px" role="img" aria-label="Ciro grafiği">'+bk.map(function(b){return'<div title="'+b.l+': '+f(b.rev)+'" style="flex:1;background:var(--pink);min-height:2px;height:'+Math.max(1,b.rev/mx*100)+'%"></div>'}).join('')+'</div><div style="display:flex;gap:'+(per=='day'?6:10)+'px;font-size:10px;color:#858085;margin-top:6px">'+bk.map(function(b){return'<div style="flex:1;text-align:center;overflow:hidden">'+b.l.split(' ')[0]+'</div>'}).join('')+'</div></div>'+
 '<div class="card" style="overflow-x:auto"><table class="tb"><tr><th>Dönem</th><th>Sipariş</th><th>Ciro</th><th>Bekleyen</th><th>İade</th><th>İade tutarı</th></tr>'+bk.slice().reverse().map(function(b){return'<tr><td>'+b.l+'</td><td>'+b.n+'</td><td><b>'+f(b.rev)+'</b></td><td>'+b.pend+'</td><td>'+b.ret+'</td><td>'+(b.retAmt?f(b.retAmt):'—')+'</td></tr>'}).join('')+'</table><p style="font-size:12px;color:#858085;margin-top:10px">Ciro: iptal, iade ve iade talebi olan siparişler hariçtir. Hafta pazartesi başlar.</p></div>'}
function draw(){$$('.ah [data-t]').forEach(function(b){b.classList.toggle('on',b.dataset.t==tab)});
 $('#app').innerHTML=(note?'<div class="dm" style="margin-bottom:16px">'+esc(note)+'</div>':'')+(tab=='dash'?dash():tab=='ord'?ordTab():tab=='rep'?repTab():tab=='prod'?prods():pub());bind()}
function preparePhoto(file){
 return new Promise(function(resolve,reject){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>15000000){reject(new Error('JPEG, PNG veya WebP seçin. Dosya sınırı 15 MB.'));return}
  var url=URL.createObjectURL(file),img=new Image();
  img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('Fotoğraf açılamadı.'))};
  img.onload=function(){
   URL.revokeObjectURL(url);
   try{
    var scale=Math.min(1,960/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    var ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);
    // WebP keeps transparency. Browsers without a WebP encoder fall back to PNG.
    resolve(file.type==='image/jpeg'?c.toDataURL('image/jpeg',.76):c.toDataURL('image/webp',.88));
   }catch(e){reject(new Error('Fotoğraf işlenemedi.'))}
  };
  img.src=url;
 })
}
function showPhotos(){
 var box=$('#f_photos');if(!box)return;
 box.innerHTML=(edit.images||[]).map(function(src,i){return '<div><img src="'+esc(src)+'" alt="" width="68" height="76" style="object-fit:cover;display:block"><button type="button" class="ab" data-remove-photo="'+i+'">Kaldır</button></div>'}).join('');
 Array.from(box.querySelectorAll('[data-remove-photo]')).forEach(function(button){button.onclick=function(){edit.images.splice(+button.dataset.removePhoto,1);showPhotos()}});
}
function bind(){
 var files=$('#f_files');
 if(files){
  showPhotos();
  files.onchange=function(){
   var selected=Array.from(files.files),product=edit,button=$('#sv'),error=$('#fe');
   if(!selected.length)return;
   if((product.images||[]).length+selected.length>8){error.textContent='Bir ürüne en fazla 8 fotoğraf eklenebilir.';files.value='';return}
   button.disabled=true;files.disabled=true;error.textContent='Fotoğraflar hazırlanıyor…';
   Promise.all(selected.map(preparePhoto)).then(function(photos){
    product.images=(product.images||[]).concat(photos);
    if(edit===product){showPhotos();if(error.isConnected)error.textContent=''}
   }).catch(function(e){if(error.isConnected)error.textContent=e.message}).finally(function(){files.value='';files.disabled=false;button.disabled=false})
  };
 }
 $$('[data-per]').forEach(function(b){b.onclick=function(){per=b.dataset.per;draw()}});
 var ofs=$('#of');if(ofs)ofs.onchange=function(){of=ofs.value;draw()};
 $$('[data-os]').forEach(function(sel){sel.onchange=function(){var o=orders.filter(function(x){return x.id==sel.dataset.os})[0];o.status=sel.value;saveDemo();note='Demo: #'+o.id+' durumu “'+ST[o.status]+'” yapıldı.';draw()}});
 var rd=$('#rd');if(rd)rd.onclick=function(){orders=mkDemo();saveDemo();of='';note='Demo verisi yenilendi.';draw()};$$('[data-e]').forEach(function(b){b.onclick=function(){var p=list.filter(function(x){return x.id==b.dataset.e})[0];edit=JSON.parse(JSON.stringify(p));tab='prod';draw();scrollTo(0,0)}});
 $$('[data-d]').forEach(function(b){b.onclick=function(){var p=list.filter(function(x){return x.id==b.dataset.d})[0];if(confirm('“'+p.name+'” silinsin mi?')){list=list.filter(function(x){return x!==p});save();note='Ürün silindi (taslak).';draw()}}});
 var n=$('#new');if(n)n.onclick=function(){edit={id:Math.max.apply(0,list.map(function(p){return p.id}).concat(0))+1,_new:1,name:'',cat:'dresses',brand:'AYMELEK',orig:2500,currency:'TRY',disc:0,colors:[COL[0]],stock:{XS:0,S:5,M:5,L:5,XL:0},isNew:true,best:false,images:[],desc:'',mat:''};draw();scrollTo(0,0)};
 var q=$('#sq'),filter=$('#admin-cat');
 if(q&&filter){
  function applyFilters(){var visible=0,term=q.value.trim().toLocaleLowerCase('tr');$$('.admin-product[data-n]').forEach(function(card){card.hidden=!card.dataset.n.includes(term)||(filter.value!==''&&card.dataset.cat!==filter.value);if(!card.hidden)visible++});$('#admin-empty').hidden=visible>0}
  q.oninput=applyFilters;filter.onchange=applyFilters;applyFilters();
 }
 var c=$('#f_cat');if(c)c.onchange=function(){if($('#sv').disabled){c.value=edit.showcaseOrder?'showcase':edit.cat;return}read();var s=sizesOf(edit.cat),o={};s.forEach(function(k){o[k]=edit.stock[k]||0});edit.stock=o;draw()};
 var cx=$('#cx');if(cx)cx.onclick=function(){edit=null;draw()};
 var sv=$('#sv');if(sv)sv.onclick=function(){read();var e=$('#fe'),p=edit;if(!p.name.trim()){e.textContent='Ürün adı gerekli.';return}if(!(p.orig>0)){e.textContent='Fiyat 0’dan büyük olmalı.';return}if(p.disc<0||p.disc>90){e.textContent='İndirim 0–90 arasında olmalı.';return}if(!p.colors.length){e.textContent='En az bir renk seçin.';return}
  if(p.cat!=='care'){p.showcaseOrder=0;p.showcaseModel=''}
  if(p.showcaseOrder&&(!Number.isInteger(p.showcaseOrder)||p.showcaseOrder<1||p.showcaseOrder>6||!p.showcaseModel)){e.textContent='Vitrin sırası geçersiz.';return}
  if(p.showcaseOrder&&list.filter(function(item){return item.id!==p.id&&item.cat==='care'&&item.showcaseOrder&&Object.values(item.stock).some(function(q){return q>0})}).length>=6&&Object.values(p.stock).some(function(q){return q>0})){e.textContent='Vitrinde en fazla altı stoktaki şişe gösterilir. Önce birini çıkarın veya stok durumunu güncelleyin.';return}
  var previous=list,isNew=p._new,saved=Object.assign({},p);delete saved._new;
  list=list.some(function(x){return x.id===p.id})?list.map(function(x){return x.id===p.id?saved:x}):list.concat(saved);
  if(!save()){list=previous;e.textContent='Tarayıcıda yer kalmadı. Daha az fotoğrafla tekrar deneyin.';return}
  edit=null;note=isNew?'Ürün demo mağazasına eklendi.':'Ürün demo mağazasında güncellendi.';draw()};
 $$('.ah [data-t]').forEach(function(b){b.onclick=function(){tab=b.dataset.t;edit=null;note='';draw()}});
 var dl=$('#dl');if(dl)dl.onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(list.map(function(p){var o=JSON.parse(JSON.stringify(p));delete o._new;return o}),null,1)],{type:'application/json'}));a.download='products.json';a.click()};
 var im=$('#im');if(im)im.onchange=function(){var file=im.files[0];if(!file)return;var r=new FileReader();r.onload=function(){try{var j=JSON.parse(r.result);if(!Array.isArray(j)||!j.every(window.AYMELEK_VALIDATE_PRODUCT))throw 0;list=j.map(window.AYMELEK_NORMALIZE_PRODUCT);save();note='İçe aktarıldı.';tab='prod';draw()}catch(e){alert('Geçersiz products.json dosyası.')}};r.readAsText(file)};
 var rs=$('#rs');if(rs)rs.onclick=function(){if(confirm('Taslak silinip örnek ürünlere dönülsün mü?')){list=JSON.parse(JSON.stringify(window.AYMELEK_DEFAULTS));save();note='Örnek ürünlere sıfırlandı.';draw()}}}
function read(){var p=edit;p.name=$('#f_name').value;var category=$('#f_cat').value;p.cat=category==='showcase'?'care':category;p.brand=$('#f_brand').value||'AYMELEK';p.orig=+$('#f_orig').value;p.disc=+$('#f_disc').value||0;p.isNew=$('#f_new').checked;p.best=$('#f_best').checked;p.desc=$('#f_desc').value;p.mat=$('#f_mat').value;
 p.showcaseOrder=category==='showcase'?(p.showcaseOrder||[1,2,3,4,5,6].find(function(slot){return !list.some(function(item){return item.id!==p.id&&item.showcaseOrder===slot&&Object.values(item.stock||{}).some(function(q){return q>0})})})||1):0;
 p.showcaseModel=category==='showcase'?(p.showcaseModel||'spray'):'';
 p.colors=COL.filter(function(c){return $$('input[name=fc]:checked').some(function(i){return i.value==c[0]})});
 var st={};$$('[data-s]').forEach(function(i){st[i.dataset.s]=Math.max(0,parseInt(i.value)||0)});p.stock=st}
loadDemo();init()})();
