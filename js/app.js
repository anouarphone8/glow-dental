/* Yousf Dent — catalogue PWA (vanilla JS) */
(() => {
'use strict';
const C = window.CFG;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $('#view');
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' DH';
const wa = text => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
const buzz = () => { try { navigator.vibrate && navigator.vibrate(12); } catch {} };

/* ---------- home sections (ids from data/products.json) ---------- */
const SLIDES = [
  { cat: 'hy', k: 'Hygiène', t: 'Désinfection instruments & surfaces', s: 'Prosept, Bechtol, BMS, Dentoviractis', img: 'desinfectant-instruments-prosept-fortis', bg: 'linear-gradient(135deg,#0A2A66,#1557D6)' },
  { cat: 'eq', k: 'Équipements', t: 'Équipez votre cabinet', s: 'Scialytiques, compresseur, aspiration', img: 'scialytique-led', bg: 'linear-gradient(135deg,#0B6E5A,#16B88A)' },
  { cat: 'en', k: 'Endodontie', t: 'Tout pour vos traitements canalaires', s: 'Limes, EDTA, gutta, digue', img: 'revo-s', bg: 'linear-gradient(135deg,#1A2F7A,#5B3CC4)' },
  { cat: 'co', k: 'Composite', t: 'Coffrets & recharges composites', s: 'Z250, Gradia, Tetric N-Ceram…', img: 'coffret-dmp', bg: 'linear-gradient(135deg,#0A2A66,#0E8AB8)' }
];
const CAT_IMG = { uu: 'masque', hy: 'desinfectant-surfaces-prosept-spray', fr: 'fraise-a-resine', em: 'alginate-kromopan', en: 'limes-k-h-broches-mani', fc: 'eugenol', co: 'recharge-gradia', ci: 'fuji-plus', ad: 'ambar', pr: 'brossettes', pe: 'turbine-skyma', eq: 'scialytique-led', or: 'brackets-ceramique', in: 'coffret-de-daviers' };
const STARS = ['masque', 'gants-nitrile', 'canules-salivaires', 'alginate-kromopan', 'fraise-diamantee-mani', 'limes-k-h-broches-mani', 'recharge-z250', '3m-single-bond-universal', 'eugenol', 'turbine-skyma'];
const PACKS = [
  { id: 'hygiene', name: 'Pack hygiène fauteuil', d: 'Masques, gants, charlottes, gobelets, serviettes, canules', items: [['masque'], ['gants-nitrile'], ['charlotte'], ['gobelets'], ['serviettes-couleur'], ['canules-salivaires']] },
  { id: 'empreinte', name: 'Pack empreinte alginate', d: 'Alginate, bol, spatule, porte-empreintes', items: [['alginate-kromopan'], ['bol-a-alginate'], ['spatule-plastique'], ['porte-empreintes-plastique']] },
  { id: 'endo', name: 'Pack endo de base', d: 'Limes K, tire-nerfs, cônes papier, EDTA, irrigation', items: [['limes-k-h-broches-mani', 0], ['tire-nerfs-mani'], ['cones-gutta-papier', 1], ['edta-liquide'], ['hypochlorite-de-sodium'], ['aiguilles-d-irrigation-canalaire-sideport']] },
  { id: 'sterilisation', name: 'Pack stérilisation', d: 'Rouleau 7,5 cm, désinfectants 1 L, lingettes', items: [['rouleau-de-sterilisation', 1], ['desinfectant-instruments-prosept-fortis', 1], ['desinfectant-surfaces-prosept-spray', 1], ['lingettes-desinfectantes', 0]] }
];
const SUGGEST = ['Gants', 'Alginate', 'Désinfectant', 'Turbine', 'Composite', 'Lime', 'Brackets', 'Fraise'];
const STATUS = ['nouvelle', 'confirmée', 'en livraison', 'livrée', 'annulée'];

/* ---------- data ---------- */
let CATS = [], PRODUCTS = [], BY = {}, REF = {};
function setData(cats, products) {
  CATS = cats; PRODUCTS = products.filter(p => p && p.id && p.name);
  BY = {}; PRODUCTS.forEach(p => BY[p.id] = p);
}
const catName = id => (CATS.find(c => c.id === id) || {}).name || '';
const img = id => `img/p/${encodeURIComponent(id)}.webp`;
const priceOf = (p, vi) => p.v ? (p.v[vi] || p.v[0]).p : p.p;
const minPrice = p => p.v ? Math.min(...p.v.map(o => o.p).filter(x => x != null)) : p.p;
const hasPrice = n => n != null && isFinite(n);
const ref = p => REF[p.id] || 'YD-' + p.id.slice(0, 6).toUpperCase();
const optLabel = (p, vi) => p.v ? (p.v[vi] || p.v[0]).l : '';

/* ---------- cart ---------- */
let cart = ls.get('yd_cart', []);
const key = (id, vi) => id + '|' + (vi ?? 0);
const qtyOf = (id, vi) => (cart.find(l => l.k === key(id, vi)) || {}).q || 0;
function saveCart() {
  cart = cart.filter(l => l.q > 0 && BY[l.id]);
  ls.set('yd_cart', cart); updateBadge();
}
function setQty(id, vi, q) {
  const k = key(id, vi); let l = cart.find(x => x.k === k);
  if (!l) { l = { k, id, vi: vi ?? 0, q: 0 }; cart.push(l); }
  l.q = Math.max(0, Math.min(999, q)); saveCart(); refreshCtrls(id);
}
function addToCart(id, vi, q = 1, fromImg) {
  const p = BY[id]; if (!p || p.dispo === false) return;
  setQty(id, vi, qtyOf(id, vi) + q); buzz();
  if (fromImg) fly(fromImg);
}
function cartTotals() {
  let n = 0, total = 0, ask = 0;
  cart.forEach(l => { const p = BY[l.id]; if (!p) return; n += l.q; const pr = priceOf(p, l.vi); hasPrice(pr) ? total += pr * l.q : ask++; });
  return { n, total, ask };
}
function updateBadge() {
  const { n, total } = cartTotals(); const b = $('#cartBadge');
  const was = b.textContent; b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
  if (n && was !== b.textContent) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  $('#cartTabLabel').textContent = n && total ? fmt(total) : 'Panier';
}

/* ---------- UI helpers ---------- */
const ICON = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.2v.1"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/></svg>'
};
function priceHTML(p) {
  const m = minPrice(p);
  if (!hasPrice(m)) return '<span class="price ask">Prix sur demande</span>';
  const multi = p.v && new Set(p.v.map(o => o.p)).size > 1;
  return `<span class="price">${multi ? '<small>dès </small>' : ''}${fmt(m)}</span>`;
}
function ctrlHTML(p) {
  if (p.dispo === false) return `<button class="add" data-ctrl="${esc(p.id)}" disabled aria-label="Indisponible">${ICON.plus}</button>`;
  if (p.v) return `<button class="add" data-ctrl="${esc(p.id)}" data-act="open" data-id="${esc(p.id)}" aria-label="Choisir une option">${ICON.plus}</button>`;
  const q = qtyOf(p.id, 0);
  if (!q) return `<button class="add" data-ctrl="${esc(p.id)}" data-act="add" data-id="${esc(p.id)}" aria-label="Ajouter ${esc(p.name)}">${ICON.plus}</button>`;
  return `<div class="stepper" data-ctrl="${esc(p.id)}"><button data-act="dec" data-id="${esc(p.id)}" aria-label="Moins">−</button><b>${q}</b><button data-act="inc" data-id="${esc(p.id)}" aria-label="Plus">+</button></div>`;
}
function refreshCtrls(id) { const p = BY[id]; if (p) $$(`[data-ctrl="${CSS.escape(id)}"]`).forEach(el => el.outerHTML = ctrlHTML(p)); }
function cardHTML(p) {
  const out = p.dispo === false;
  const tag = out ? '<span class="tag out">Rupture</span>' : p.v ? `<span class="tag">${p.v.length} choix</span>` : '';
  return `<article class="card reveal${out ? ' is-out' : ''}">
    <a class="ph" href="#p-${esc(p.id)}">${tag}<img src="${img(p.id)}" alt="${esc(p.name)}" loading="lazy" width="340" height="340"></a>
    <div class="body"><a class="name" href="#p-${esc(p.id)}">${esc(p.name)}</a><div class="u">${esc(p.u || '')}</div>
    <div class="row">${priceHTML(p)}${ctrlHTML(p)}</div></div></article>`;
}
const topbar = (title, back = true, extra = '') => `<header class="topbar">${back ? `<button class="iconbtn" data-act="back" aria-label="Retour">${ICON.back}</button>` : ''}<h1>${esc(title)}</h1>${extra}</header>`;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200);
}
function fly(fromImg) {
  const tab = $('.tab-cart svg'); if (!fromImg || !tab) return;
  const a = fromImg.getBoundingClientRect(), b = tab.getBoundingClientRect();
  if (!a.width) return;
  const f = document.createElement('img'); f.src = fromImg.src; f.className = 'fly';
  f.style.left = (a.left + a.width / 2 - 32) + 'px'; f.style.top = (a.top + a.height / 2 - 32) + 'px';
  document.body.appendChild(f);
  requestAnimationFrame(() => {
    f.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.2)`;
    f.style.opacity = '.4';
  });
  setTimeout(() => { f.remove(); const t = $('.tab-cart'); t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }, 700);
}
let io;
function reveal() {
  if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(e => e.classList.add('in')); return; }
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -20px 0px' });
  $$('.reveal:not(.in)').forEach((e, i) => { e.style.transitionDelay = Math.min(i % 6, 5) * 40 + 'ms'; io.observe(e); });
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c);
  const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#16B88A', '#1557D6', '#0A2A66', '#FFC24B', '#4EBBD6'];
  const ps = Array.from({ length: 120 }, () => ({ x: c.width / 2, y: c.height / 3, vx: (Math.random() - .5) * 12, vy: Math.random() * -12 - 3, s: Math.random() * 6 + 4, r: Math.random() * 6, c: cols[Math.random() * cols.length | 0] }));
  let t = 0;
  (function f() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
    if (++t < 110) requestAnimationFrame(f); else c.remove();
  })();
}

/* ---------- pages ---------- */
let sliderTimer;
function pageHome() {
  const stars = STARS.map(id => BY[id]).filter(Boolean);
  const equip = PRODUCTS.filter(p => (p.cat === 'eq' || p.cat === 'pe') && hasPrice(minPrice(p))).sort((a, b) => minPrice(b) - minPrice(a)).slice(0, 10);
  const cheap = PRODUCTS.filter(p => p.dispo !== false && hasPrice(minPrice(p)) && minPrice(p) <= 40).sort((a, b) => minPrice(a) - minPrice(b)).slice(0, 8);
  return `
  <header class="hero">
    <div class="brand"><span class="mark"><img src="img/ui/logo.png" alt=""></span><div style="min-width:0"><b>YOUSF DENT</b><small>Matériel & consommables dentaires</small></div>
      <button class="install" data-act="install" id="installBtn" hidden>${ICON.dl.replace('<svg', '<svg width="16" height="16"')}Installer</button></div>
    <a class="searchbar" href="#/search" aria-label="Rechercher">${ICON.search}<input placeholder="Rechercher parmi ${PRODUCTS.length} produits…" readonly tabindex="-1"></a>
  </header>
  <div class="slider reveal" id="slider"><div class="slides">${SLIDES.map((s, i) => `
    <a class="slide${i ? '' : ' cur'}" href="#/c/${s.cat}" style="background:${s.bg}"><i class="glow"></i><i class="glow b"></i>
      <div class="txt"><small>${esc(s.k)}</small><h3>${esc(s.t)}</h3><p>${esc(s.s)}</p><span class="cta">Découvrir →</span></div>
      <img src="${img(s.img)}" alt="" loading="${i ? 'lazy' : 'eager'}"></a>`).join('')}</div>
    <div class="dots">${SLIDES.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div></div>
  <div class="trust"><div><i>✅</i>Produits de qualité</div><div><i>⚡</i>Disponibilité et réactivité</div><div><i>🤝</i>Conseil et accompagnement</div><div><i>🎧</i>Service professionnel</div></div>
  <section class="section"><div class="sec-head"><h2>Catégories</h2><a href="#/cats">Tout voir</a></div>
    <div class="circles">${CATS.map(c => `<a class="circle reveal" href="#/c/${c.id}"><span class="ph"><img src="${img(CAT_IMG[c.id] || (PRODUCTS.find(p => p.cat === c.id) || {}).id)}" alt="" loading="lazy"></span>${esc(c.name)}</a>`).join('')}</div></section>
  <section class="section"><div class="sec-head"><div><h2>Les incontournables</h2><p>Les consommables du quotidien</p></div></div>
    <div class="hscroll">${stars.map(cardHTML).join('')}</div></section>
  <section class="section"><div class="sec-head"><div><h2>Packs cabinet</h2><p>Ajoutés au panier en 1 clic</p></div></div>
    <div class="hscroll" style="grid-auto-columns:84%">${PACKS.map(packHTML).join('')}</div></section>
  <section class="section"><div class="sec-head"><h2>Équipements</h2><a href="#/c/eq">Tout voir</a></div>
    <div class="hscroll">${equip.map(cardHTML).join('')}</div></section>
  <section class="section"><div class="sec-head"><div><h2>Petits prix</h2><p>40 DH et moins</p></div></div>
    <div class="grid">${cheap.map(cardHTML).join('')}</div></section>
  ${footerHTML()}`;
}
function packItems(pk) { return pk.items.map(([id, vi]) => ({ p: BY[id], vi: vi || 0 })).filter(x => x.p && x.p.dispo !== false); }
function packHTML(pk) {
  const it = packItems(pk); const total = it.reduce((s, x) => s + (priceOf(x.p, x.vi) || 0), 0);
  return `<div class="pack reveal"><h3>${esc(pk.name)}</h3><p>${esc(pk.d)} · ${it.length} articles</p>
    <div class="thumbs">${it.slice(0, 5).map(x => `<img src="${img(x.p.id)}" alt="" loading="lazy">`).join('')}${it.length > 5 ? `<span>+${it.length - 5}</span>` : ''}</div>
    <div class="row"><span class="price">${fmt(total)}</span><button class="btn green sm" data-act="pack" data-id="${pk.id}">${ICON.plus.replace('<svg', '<svg fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"')}Ajouter le pack</button></div></div>`;
}
function footerHTML() {
  return `<footer class="footer reveal"><div class="brand"><span class="mark"><img src="img/ui/logo.png" alt=""></span><div><b>YOUSF DENT</b><small>${esc(C.tagline)}</small></div></div>
    <p>📍 ${esc(C.address)}</p><p>📞 ${esc(C.phone)}</p>
    <div class="contacts">${C.contacts.map(c => `<a href="tel:${c.tel}"><span>${esc(c.zone)} · ${esc(c.name)}</span><b>${c.tel.replace(/(\d{2})(?=\d)/g, '$1 ')}</b></a>`).join('')}</div>
    <p class="copy">© ${new Date().getFullYear()} ${esc(C.shop)} · Prix en dirhams (DH)</p></footer>`;
}
function startSlider() {
  clearInterval(sliderTimer);
  const s = $('#slider'); if (!s) return;
  const track = $('.slides', s), dots = $$('.dots i', s), slides = $$('.slide', s); let i = 0, x0 = null, moved = false;
  const go = n => { i = (n + slides.length) % slides.length; track.style.transform = `translateX(${-i * 100}%)`; dots.forEach((d, k) => d.classList.toggle('on', k === i)); slides.forEach((d, k) => d.classList.toggle('cur', k === i)); };
  const auto = () => { clearInterval(sliderTimer); sliderTimer = setInterval(() => go(i + 1), 4000); };
  track.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
  track.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { moved = true; go(i + (dx < 0 ? 1 : -1)); auto(); } });
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  auto();
}
function pageCats() {
  return topbar('Catégories', false) + `<div class="catgrid">${CATS.map(c => {
    const ps = PRODUCTS.filter(p => p.cat === c.id);
    return `<a class="cat reveal" href="#/c/${c.id}"><div class="imgs">${ps.slice(0, 4).map(p => `<img src="${img(p.id)}" alt="" loading="lazy">`).join('')}</div><b>${esc(c.name)}</b><small>${ps.length} produits</small></a>`;
  }).join('')}</div>`;
}
let sortMode = 'def';
function sortList(list) {
  const pv = p => hasPrice(minPrice(p)) ? minPrice(p) : null;
  const l = [...list];
  if (sortMode === 'asc') l.sort((a, b) => (pv(a) ?? 1e9) - (pv(b) ?? 1e9));
  if (sortMode === 'desc') l.sort((a, b) => (pv(b) ?? -1) - (pv(a) ?? -1));
  if (sortMode === 'az') l.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return l;
}
function pageCat(id) {
  const c = CATS.find(x => x.id === id); if (!c) return pageCats();
  const list = sortList(PRODUCTS.filter(p => p.cat === id));
  return topbar(c.name, true, `<a class="iconbtn" href="#/search" aria-label="Rechercher">${ICON.search}</a>`) +
    `<div class="chips" id="chips">${CATS.map(x => `<a class="chip${x.id === id ? ' on' : ''}" href="#/c/${x.id}">${esc(x.name)}</a>`).join('')}</div>
    <div class="sortbar"><span>${list.length} produits</span><label class="sr" hidden for="sort">Trier</label>
      <select id="sort" data-act="sort" aria-label="Trier"><option value="def">Pertinence</option><option value="asc">Prix ↑</option><option value="desc">Prix ↓</option><option value="az">A → Z</option></select></div>
    <div class="list"><div class="grid">${list.map(cardHTML).join('')}</div></div>`;
}

/* search */
let searchQ = '';
function searchHay(p) { return p._h || (p._h = norm([p.name, catName(p.cat), p.u, ...(p.v || []).map(o => o.l)].join(' '))); }
function doSearch(q) {
  const toks = norm(q).split(/\s+/).filter(Boolean); if (!toks.length) return [];
  const n0 = toks.join(' ');
  return PRODUCTS.filter(p => toks.every(t => searchHay(p).includes(t)))
    .map(p => ({ p, s: (norm(p.name).startsWith(n0) ? 0 : norm(p.name).includes(n0) ? 1 : 2) }))
    .sort((a, b) => a.s - b.s || a.p.name.localeCompare(b.p.name, 'fr')).map(x => x.p);
}
function pageSearch() {
  return topbar('Recherche') + `<label class="sfield">${ICON.search}<input id="q" type="text" enterkeyhint="search" autocomplete="off" placeholder="Gants, alginate, turbine…" value="${esc(searchQ)}" aria-label="Rechercher un produit"><button data-act="clearq" aria-label="Effacer" ${searchQ ? '' : 'hidden'}>×</button></label>
    <div id="results" style="padding-top:14px"></div>`;
}
function renderResults() {
  const box = $('#results'); if (!box) return;
  const q = searchQ.trim();
  if (!q) {
    const rec = ls.get('yd_recent', []);
    box.innerHTML = (rec.length ? `<section class="section" style="padding-top:0"><div class="sec-head"><h2>Recherches récentes</h2><a href="#" data-act="clearrec">Effacer</a></div><div class="chips" style="padding:0;flex-wrap:wrap">${rec.map(r => `<button class="chip" data-act="q" data-q="${esc(r)}">🕘 ${esc(r)}</button>`).join('')}</div></section>` : '') +
      `<section class="section" style="padding-top:${rec.length ? 18 : 0}px"><div class="sec-head"><h2>Suggestions</h2></div><div class="chips" style="padding:0;flex-wrap:wrap">${SUGGEST.map(r => `<button class="chip" data-act="q" data-q="${esc(r)}">${esc(r)}</button>`).join('')}</div></section>`;
    return;
  }
  const res = doSearch(q);
  if (!res.length) {
    box.innerHTML = `<div class="empty"><div class="ico">🔎</div><h3>Aucun résultat pour « ${esc(q)} »</h3><p>Ce produit n'est pas encore en ligne ? Demandez-nous directement.</p>
      <a class="btn green" href="${wa('Bonjour Yousf Dent, je cherche : ' + q)}" target="_blank" rel="noopener">${ICON.wa}Demander sur WhatsApp</a></div>`;
    return;
  }
  box.innerHTML = `<div class="sortbar"><span>${res.length} résultat${res.length > 1 ? 's' : ''}</span></div><div class="list"><div class="grid">${res.map(cardHTML).join('')}</div></div>`;
  reveal();
}
function saveRecent(q) {
  q = q.trim(); if (q.length < 2) return;
  ls.set('yd_recent', [q, ...ls.get('yd_recent', []).filter(r => norm(r) !== norm(q))].slice(0, 8));
}

/* cart & checkout */
const stepsHTML = n => `<div class="steps">${['Panier', 'Coordonnées', 'Confirmation'].map((s, i) => `<i class="${i < n ? 'on' : ''}">${s}</i>`).join('')}</div>`;
function lineHTML(l) {
  const p = BY[l.id]; const pr = priceOf(p, l.vi);
  return `<div class="line reveal"><a href="#p-${esc(p.id)}"><img src="${img(p.id)}" alt="" loading="lazy"></a><div class="mid"><b>${esc(p.name)}</b>${p.v ? `<small>${esc(optLabel(p, l.vi))}</small>` : ''}<span class="price${hasPrice(pr) ? '' : ' ask'}">${hasPrice(pr) ? fmt(pr * l.q) : 'Prix sur demande'}</span></div>
    <div class="stepper"><button data-act="ldec" data-k="${esc(l.k)}" aria-label="Moins">${l.q > 1 ? '−' : '🗑'}</button><b>${l.q}</b><button data-act="linc" data-k="${esc(l.k)}" aria-label="Plus">+</button></div></div>`;
}
function summaryHTML() {
  const { n, total, ask } = cartTotals();
  return `<div class="summary"><div><span>Articles</span><b>${n}</b></div>${ask ? `<div><span>Prix sur demande</span><b>${ask} article${ask > 1 ? 's' : ''}</b></div>` : ''}<div class="tot"><span>Total</span><span class="counter">${fmt(total)}</span></div></div>`;
}
function pageCart() {
  saveCart();
  if (!cart.length) return topbar('Panier', false) + `<div class="empty"><div class="ico">🛒</div><h3>Votre panier est vide</h3><p>Parcourez le catalogue et ajoutez vos produits.</p><a class="btn" href="#/cats">Voir les catégories</a></div>`;
  return topbar('Panier', false, `<button class="iconbtn" data-act="emptycart" aria-label="Vider le panier">${ICON.close}</button>`) + stepsHTML(1) +
    `<div class="list">${cart.map(lineHTML).join('')}${summaryHTML()}${cartTotals().ask ? '<div class="note">Les articles « prix sur demande » seront confirmés par WhatsApp.</div>' : ''}
    <div class="bottomcta"><a class="btn block" href="#/checkout">Continuer · ${fmt(cartTotals().total)}</a></div></div>`;
}
const FIELDS = [
  ['nom', 'Nom complet', true, 'text', 'name'], ['cabinet', 'Cabinet', false, 'text', 'organization'],
  ['tel', 'Téléphone', true, 'tel', 'tel'], ['ville', 'Ville', true, 'text', 'address-level2'],
  ['adresse', 'Adresse', true, 'text', 'street-address'], ['remarque', 'Remarque', false, 'area', 'off']
];
function pageCheckout() {
  if (!cart.length) { location.hash = '#/cart'; return ''; }
  const c = ls.get('yd_client', {});
  return topbar('Coordonnées') + stepsHTML(2) + `<form class="list form" id="coForm" novalidate>${FIELDS.map(([k, l, req, t, ac]) => `
    <div class="field" data-f="${k}"><label for="f_${k}">${l} ${req ? '<i>*</i>' : ''}</label>
    ${t === 'area' ? `<textarea id="f_${k}" name="${k}" placeholder="Précisions pour la commande (facultatif)">${esc(c[k] || '')}</textarea>` :
      `<input id="f_${k}" name="${k}" type="${t}" autocomplete="${ac}" ${t === 'tel' ? 'inputmode="tel" placeholder="06 XX XX XX XX"' : ''} value="${esc(c[k] || '')}">`}
    <div class="msg">${k === 'tel' ? 'Numéro marocain valide requis (06…, 07… ou 05…)' : 'Ce champ est obligatoire'}</div></div>`).join('')}
    <div class="bottomcta"><button class="btn block" type="submit">Vérifier ma commande</button></div></form>`;
}
const telOk = t => /^(?:\+?212|0)[5-7]\d{8}$/.test(String(t).replace(/[\s.\-()]/g, ''));
function validate(form) {
  const c = Object.fromEntries(new FormData(form)); let ok = true, first;
  FIELDS.forEach(([k, , req]) => {
    const bad = (req && !String(c[k] || '').trim()) || (k === 'tel' && !telOk(c[k] || ''));
    $(`[data-f="${k}"]`, form).classList.toggle('err', bad); if (bad) { ok = false; first = first || k; }
  });
  if (first) $('#f_' + first).focus();
  return ok && c;
}
function pageConfirm() {
  const c = ls.get('yd_client', null);
  if (!cart.length) { location.hash = '#/cart'; return ''; }
  if (!c || !telOk(c.tel || '')) { location.hash = '#/checkout'; return ''; }
  return topbar('Confirmation') + stepsHTML(3) + `<div class="list">
    <div class="card2 reveal"><h3>Livré à</h3><p><b>${esc(c.nom)}</b>${c.cabinet ? ' · ' + esc(c.cabinet) : ''}</p><p>${esc(c.tel)}</p><p>${esc(c.adresse)}, ${esc(c.ville)}</p>${c.remarque ? `<p style="color:var(--muted)">📝 ${esc(c.remarque)}</p>` : ''}<p style="margin-top:8px"><a href="#/checkout" style="color:var(--blue);font-weight:700">Modifier</a></p></div>
    <div class="card2 reveal"><h3>${cartTotals().n} article(s)</h3>${cart.map(l => { const p = BY[l.id], pr = priceOf(p, l.vi); return `<p style="display:flex;justify-content:space-between;gap:10px"><span>${l.q} × ${esc(p.name)}${p.v ? ' (' + esc(optLabel(p, l.vi)) + ')' : ''}</span><b style="white-space:nowrap">${hasPrice(pr) ? fmt(pr * l.q) : 'sur demande'}</b></p>`; }).join('')}</div>
    ${summaryHTML()}
    <div class="bottomcta"><button class="btn green block" data-act="send">${ICON.wa}Confirmer et envoyer sur WhatsApp</button></div></div>`;
}
function waOrderText(o) {
  const L = [`*Nouvelle commande ${o.num}*`, `${C.shop}`, ''];
  o.items.forEach(i => L.push(`• ${i.q} × ${i.name}${i.label ? ' (' + i.label + ')' : ''} — ${hasPrice(i.p) ? fmt(i.p * i.q) : 'prix sur demande'}`));
  L.push('', `*Total : ${fmt(o.total)}*${o.items.some(i => !hasPrice(i.p)) ? ' (+ articles sur demande)' : ''}`, '');
  const c = o.client;
  L.push(`👤 ${c.nom}`); if (c.cabinet) L.push(`🏥 ${c.cabinet}`);
  L.push(`📞 ${c.tel}`, `📍 ${c.adresse}, ${c.ville}`); if (c.remarque) L.push(`📝 ${c.remarque}`);
  return L.join('\n');
}
function localNum() {
  const d = new Date(), ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const k = 'yd_seq_' + ymd, n = ls.get(k, 0) + 1; ls.set(k, n);
  return `${C.orderPrefix}-${ymd}-${String(n).padStart(3, '0')}`;
}
async function sendOrder(btn) {
  const c = ls.get('yd_client', {}); if (!cart.length) return;
  btn.disabled = true; btn.textContent = 'Envoi…';
  const items = cart.map(l => { const p = BY[l.id]; return { id: p.id, vi: l.vi, q: l.q, name: p.name, label: optLabel(p, l.vi), p: priceOf(p, l.vi) }; });
  const o = { num: '', date: new Date().toISOString(), items, total: cartTotals().total, client: c, status: 'nouvelle' };
  if (C.api) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(C.api, { method: 'POST', body: JSON.stringify({ action: 'order', client: c, items: items.map(({ id, vi, q }) => ({ id, vi, q })) }), signal: ctl.signal });
      clearTimeout(t); const j = await r.json();
      if (j.ok) { o.num = j.num; o.total = j.total; o.synced = true; }
    } catch {}
  }
  if (!o.num) o.num = localNum();
  const orders = ls.get('yd_orders', []); orders.unshift(o); ls.set('yd_orders', orders.slice(0, 50));
  cart = []; saveCart();
  location.hash = '#/done/' + o.num;
  setTimeout(() => { location.href = wa(waOrderText(o)); }, 900);
}
function pageDone(num) {
  const o = ls.get('yd_orders', []).find(x => x.num === num);
  if (!o) return pageOrders();
  setTimeout(confetti, 150);
  return `<div class="done page-in"><div class="ok"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <h1 style="font-size:23px">Commande enregistrée !</h1><p style="color:var(--muted);margin:6px 0 0">Votre numéro de commande</p>
    <div class="num">${esc(o.num)}</div>
    <p style="color:var(--muted);margin:0 0 18px">WhatsApp s'ouvre avec votre commande. Envoyez le message pour la valider.</p>
    <a class="btn green block" href="${wa(waOrderText(o))}" target="_blank" rel="noopener">${ICON.wa}Ouvrir WhatsApp</a>
    <a class="btn ghost block" href="#/orders" style="margin-top:10px">Mes commandes</a></div>`;
}
function pageOrders() {
  const orders = ls.get('yd_orders', []);
  if (!orders.length) return topbar('Mes commandes', false) + `<div class="empty"><div class="ico">🧾</div><h3>Aucune commande</h3><p>Vos commandes apparaîtront ici.</p><a class="btn" href="#/">Commencer mes achats</a></div>`;
  return topbar('Mes commandes', false) + `<div class="list">${orders.map(o => `
    <div class="order reveal"><header><b>${esc(o.num)}</b><span class="st st-${esc((o.status || 'nouvelle').replace(/ /g, '-'))}" data-st="${esc(o.num)}">${esc(o.status || 'nouvelle')}</span></header>
    <div class="meta">${new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${o.items.reduce((s, i) => s + i.q, 0)} article(s)</div>
    <div class="thumbs">${o.items.slice(0, 6).map(i => `<img src="${img(i.id)}" alt="" loading="lazy">`).join('')}</div>
    <div class="row"><span class="price">${fmt(o.total)}</span><span style="display:flex;gap:8px"><a class="btn ghost sm" href="${wa(waOrderText(o))}" target="_blank" rel="noopener" aria-label="Renvoyer sur WhatsApp">${ICON.wa}</a><button class="btn sm" data-act="reorder" data-num="${esc(o.num)}">Commander à nouveau</button></span></div></div>`).join('')}</div>`;
}
async function refreshStatuses() {
  if (!C.api) return;
  const orders = ls.get('yd_orders', []); let changed = false;
  await Promise.all(orders.slice(0, 10).map(async o => {
    try {
      const j = await (await fetch(`${C.api}?action=status&num=${encodeURIComponent(o.num)}&tel=${encodeURIComponent(o.client.tel)}`)).json();
      if (j.ok && j.status && j.status !== o.status) { o.status = j.status; changed = true; }
    } catch {}
  }));
  if (changed) {
    ls.set('yd_orders', orders);
    orders.forEach(o => { const el = $(`[data-st="${CSS.escape(o.num)}"]`); if (el) { el.textContent = o.status; el.className = 'st st-' + o.status.replace(/ /g, '-'); } });
  }
}

/* ---------- product sheet ---------- */
const sheet = $('#sheet'), sheetBg = $('#sheetBg');
let sh = null;
function openSheet(id) {
  const p = BY[id]; if (!p) { location.hash = '#/'; return; }
  const vi = p.v ? Math.max(0, p.v.findIndex(o => hasPrice(o.p))) : 0;
  sh = { p, vi, q: 1 };
  renderSheet(); sheet.hidden = sheetBg.hidden = false; sheet.classList.remove('closing');
  document.body.style.overflow = 'hidden';
  document.title = `${p.name} — ${C.shop}`;
}
function renderSheet() {
  const { p, vi, q } = sh; const out = p.dispo === false, pr = priceOf(p, vi);
  const sim = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 10);
  sheet.innerHTML = `<div class="grab" id="grab"></div><button class="iconbtn close" data-act="closesheet" aria-label="Fermer">${ICON.close}</button>
  <div class="scroll" id="sheetScroll">
    <div class="zoom" id="zoom"><img src="${img(p.id)}" alt="${esc(p.name)}"><span class="hint">Toucher pour zoomer</span></div>
    <div class="pinfo"><div class="badges">${out ? '<span class="pill out">Rupture de stock</span>' : '<span class="pill ok">● Disponible</span>'}<span class="pill">${esc(catName(p.cat))}</span><span class="pill grey">Réf. ${esc(ref(p))}</span></div>
      <h2>${esc(p.name)}</h2><div class="bigprice" id="bigprice">${hasPrice(pr) ? fmt(pr) : '<span style="font-size:18px;color:var(--blue)">Prix sur demande</span>'}</div>
      ${p.v ? `<div class="opts" role="radiogroup" aria-label="Options">${p.v.map((o, i) => `<button class="opt${i === vi ? ' on' : ''}" role="radio" aria-checked="${i === vi}" data-act="opt" data-i="${i}"><b>${esc(o.l)}</b><small>${hasPrice(o.p) ? fmt(o.p) : 'Sur demande'}</small></button>`).join('')}</div>` : ''}
      <div class="infos"><div><span>Catégorie</span><b>${esc(catName(p.cat))}</b></div><div><span>Conditionnement</span><b>${esc(p.u || '—')}</b></div><div><span>Référence</span><b>${esc(ref(p))}</b></div></div>
      <div class="actions"><a class="btn green block" id="waOne" target="_blank" rel="noopener" href="#">${ICON.wa}Commander ce produit sur WhatsApp</a>
        <div class="two"><a class="btn ghost" target="_blank" rel="noopener" href="${wa(`Bonjour ${C.shop}, j'ai une question sur : ${p.name} (Réf. ${ref(p)})`)}">${ICON.ask}Poser une question</a><button class="btn ghost" data-act="share">${ICON.share}Partager</button></div></div>
    </div>
    ${sim.length ? `<section class="section"><div class="sec-head"><h2>Produits similaires</h2></div><div class="hscroll">${sim.map(cardHTML).join('')}</div></section>` : ''}
  </div>
  <div class="sheetbar"><div class="stepper lg"><button data-act="sdec" aria-label="Moins">−</button><b id="sq">${q}</b><button data-act="sinc" aria-label="Plus">+</button></div>
    <button class="btn" data-act="sadd" id="sadd" ${out ? 'disabled' : ''}></button></div>`;
  updSheet(); reveal();
  // zoom
  const z = $('#zoom'), zi = $('img', z);
  const origin = e => { const r = z.getBoundingClientRect(); zi.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; };
  z.addEventListener('click', e => { origin(e); z.classList.toggle('on'); });
  z.addEventListener('pointermove', e => { if (z.classList.contains('on')) origin(e); });
  // swipe down to close
  let y0 = null;
  sheet.onpointerdown = e => { if ($('#sheetScroll').scrollTop <= 0 && !e.target.closest('.zoom.on,.hscroll,button,a')) { y0 = e.clientY; sheet.classList.add('drag'); } };
  sheet.onpointermove = e => { if (y0 != null) { const d = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${d}px)`; } };
  sheet.onpointerup = sheet.onpointercancel = e => { if (y0 == null) return; const d = e.clientY - y0; y0 = null; sheet.classList.remove('drag'); sheet.style.transform = ''; if (d > 110) closeSheetNav(); };
}
function updSheet() {
  const { p, vi, q } = sh, pr = priceOf(p, vi);
  $('#sq').textContent = q;
  $('#sadd').textContent = p.dispo === false ? 'Rupture de stock' : hasPrice(pr) ? `Ajouter · ${fmt(pr * q)}` : 'Ajouter · prix sur demande';
  $('#bigprice').innerHTML = hasPrice(pr) ? fmt(pr) : '<span style="font-size:18px;color:var(--blue)">Prix sur demande</span>';
  $('#waOne').href = wa(`Bonjour ${C.shop}, je souhaite commander :\n• ${q} × ${p.name}${p.v ? ' (' + optLabel(p, vi) + ')' : ''}${hasPrice(pr) ? ' — ' + fmt(pr * q) : ''}\nRéf. ${ref(p)}`);
}
function closeSheet() {
  if (sheet.hidden) return;
  sheet.hidden = sheetBg.hidden = true; sh = null; document.body.style.overflow = ''; document.title = TITLE;
}
function closeSheetNav() {
  if (!sheetDirect && history.state && history.state.sheet) history.back();
  else { sheetDirect = false; history.replaceState(null, '', lastRoute || '#/'); route(); }
}

/* ---------- router ---------- */
const TITLE = document.title;
let lastRoute = null, sheetDirect = false;
function route() {
  const h = location.hash || '#/';
  if (h.startsWith('#p-')) {
    sheetDirect = lastRoute === null;
    if (sheetDirect) render('#/');
    openSheet(decodeURIComponent(h.slice(3)));
    return;
  }
  closeSheet();
  if (h === lastRoute) return;
  render(h);
}
function render(h) {
  clearInterval(sliderTimer);
  const prev = lastRoute; lastRoute = h;
  const [, a, b] = h.split('/');
  let html, tab = 'home';
  if (a === 'cats') { html = pageCats(); tab = 'cats'; }
  else if (a === 'c') { html = pageCat(b); tab = 'cats'; }
  else if (a === 'search') html = pageSearch();
  else if (a === 'cart') { html = pageCart(); tab = 'cart'; }
  else if (a === 'checkout') { html = pageCheckout(); tab = 'cart'; }
  else if (a === 'confirm') { html = pageConfirm(); tab = 'cart'; }
  else if (a === 'done') { html = pageDone(decodeURIComponent(b || '')); tab = 'orders'; }
  else if (a === 'orders') { html = pageOrders(); tab = 'orders'; }
  else { html = pageHome(); }
  if (html === '') return;
  view.innerHTML = html; view.classList.remove('page-in'); void view.offsetWidth; view.classList.add('page-in');
  $$('.tabbar a').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
  if (!(prev && prev.startsWith('#p-'))) scrollTo(0, 0);
  if (a === 'c') { $('#sort').value = sortMode; const on = $('.chip.on'); on && on.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  if (a === 'search') { renderResults(); const q = $('#q'); q.focus(); }
  if (a === 'orders') refreshStatuses();
  if (!a) { startSlider(); showInstall(); }
  reveal();
}
window.addEventListener('hashchange', route);
// keep a history marker so "back" closes the sheet
const _push = () => { if (location.hash.startsWith('#p-')) history.replaceState({ sheet: 1 }, ''); };
window.addEventListener('hashchange', _push);

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const act = t.dataset.act, id = t.dataset.id;
  const cardImg = () => { const c = t.closest('.card'); return c && $('.ph img', c); };
  switch (act) {
    case 'add': addToCart(id, 0, 1, cardImg()); break;
    case 'inc': setQty(id, 0, qtyOf(id, 0) + 1); buzz(); break;
    case 'dec': setQty(id, 0, qtyOf(id, 0) - 1); buzz(); break;
    case 'open': location.hash = '#p-' + id; break;
    case 'back': history.length > 1 ? history.back() : (location.hash = '#/'); break;
    case 'pack': {
      const pk = PACKS.find(x => x.id === id); packItems(pk).forEach(x => setQty(x.p.id, x.vi, qtyOf(x.p.id, x.vi) + 1));
      buzz(); fly($('img', t.closest('.pack'))); toast(`${pk.name} ajouté au panier ✓`); break;
    }
    case 'closesheet': closeSheetNav(); break;
    case 'opt': sh.vi = +t.dataset.i; $$('.opt', sheet).forEach((o, i) => { o.classList.toggle('on', i === sh.vi); o.setAttribute('aria-checked', i === sh.vi); }); updSheet(); buzz(); break;
    case 'sinc': sh.q = Math.min(999, sh.q + 1); updSheet(); break;
    case 'sdec': sh.q = Math.max(1, sh.q - 1); updSheet(); break;
    case 'sadd': {
      const { p, vi, q } = sh; addToCart(p.id, vi, q, $('#zoom img'));
      toast(`${q} × ${p.name} ajouté ✓`); setTimeout(closeSheetNav, 350); break;
    }
    case 'share': {
      const p = sh.p, url = location.origin + location.pathname + '#p-' + p.id;
      if (navigator.share) navigator.share({ title: p.name, text: `${p.name} — ${C.shop}`, url }).catch(() => {});
      else { navigator.clipboard && navigator.clipboard.writeText(url); toast('Lien copié ✓'); }
      break;
    }
    case 'ldec': case 'linc': {
      const l = cart.find(x => x.k === t.dataset.k); if (!l) break;
      l.q += act === 'linc' ? 1 : -1; saveCart(); buzz(); lastRoute = null; render('#/cart'); break;
    }
    case 'emptycart': if (confirm('Vider le panier ?')) { cart = []; saveCart(); lastRoute = null; render('#/cart'); } break;
    case 'send': sendOrder(t); break;
    case 'reorder': {
      const o = ls.get('yd_orders', []).find(x => x.num === t.dataset.num); let n = 0;
      o && o.items.forEach(i => { const p = BY[i.id]; if (p && p.dispo !== false) { setQty(i.id, i.vi, qtyOf(i.id, i.vi) + i.q); n++; } });
      toast(n ? 'Articles ajoutés au panier ✓' : 'Articles indisponibles'); if (n) location.hash = '#/cart'; break;
    }
    case 'q': searchQ = t.dataset.q; $('#q').value = searchQ; $('[data-act="clearq"]').hidden = false; saveRecent(searchQ); renderResults(); break;
    case 'clearq': searchQ = ''; $('#q').value = ''; t.hidden = true; renderResults(); $('#q').focus(); break;
    case 'clearrec': e.preventDefault(); ls.set('yd_recent', []); renderResults(); break;
    case 'install': doInstall(); break;
  }
});
sheetBg.addEventListener('click', closeSheetNav);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheetNav(); });
document.addEventListener('change', e => { if (e.target.id === 'sort') { sortMode = e.target.value; const r = lastRoute; lastRoute = null; render(r); } });
let recentT;
document.addEventListener('input', e => {
  if (e.target.id === 'q') {
    searchQ = e.target.value; $('[data-act="clearq"]').hidden = !searchQ; renderResults();
    clearTimeout(recentT); recentT = setTimeout(() => doSearch(searchQ).length && saveRecent(searchQ), 1500);
  }
  if (e.target.form && e.target.form.id === 'coForm') {
    ls.set('yd_client', Object.fromEntries(new FormData(e.target.form)));
    e.target.closest('.field').classList.remove('err');
  }
});
document.addEventListener('keydown', e => { if (e.target.id === 'q' && e.key === 'Enter') { saveRecent(searchQ); e.target.blur(); } });
document.addEventListener('submit', e => {
  if (e.target.id !== 'coForm') return; e.preventDefault();
  const c = validate(e.target); if (!c) { toast('Vérifiez les champs en rouge'); return; }
  ls.set('yd_client', c); location.hash = '#/confirm';
});

/* ---------- PWA ---------- */
let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; showInstall(); });
function showInstall() { const b = $('#installBtn'); if (b) b.hidden = standalone || !(deferredPrompt || isIOS); }
async function doInstall() {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; showInstall(); }
  else if (isIOS) toast('Touchez « Partager » puis « Sur l\'écran d\'accueil »');
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

/* ---------- boot ---------- */
async function boot() {
  view.innerHTML = '<div style="padding:16px;display:grid;gap:12px"><div class="skeleton" style="height:150px"></div><div class="grid"><div class="skeleton"></div><div class="skeleton"></div></div></div>';
  const local = await (await fetch('data/products.json')).json();
  local.products.forEach((p, i) => REF[p.id] = 'YD-' + String(i + 1).padStart(3, '0'));
  const cached = ls.get('yd_remote', null);
  setData(local.cats, cached && cached.products && cached.products.length ? cached.products : local.products);
  updateBadge(); route();
  if (C.api) {
    try {
      const j = await (await fetch(`${C.api}?action=products`)).json();
      if (j.ok && j.products && j.products.length) {
        ls.set('yd_remote', { products: j.products, at: Date.now() }); setData(local.cats, j.products); updateBadge();
        const busy = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if (!busy && !location.hash.match(/checkout|confirm|done/)) { const r = lastRoute; lastRoute = null; r && render(r); if (sh) { const id = sh.p.id; openSheet(id); } }
      }
    } catch {}
  }
}
boot();
})();
