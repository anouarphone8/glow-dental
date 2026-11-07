/* Yousf Dent — admin (commandes, produits, stats) */
(() => {
'use strict';
const C = window.CFG, app = document.getElementById('app');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmt = n => Math.round(n || 0).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' DH';
const STATUS = ['nouvelle', 'confirmée', 'en livraison', 'livrée', 'annulée'];
const ss = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch {} } };
let pin = ss.get('yd_pin'), D = { orders: [], products: [] }, tab = 'orders', filter = 'toutes', pq = '';

function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); }
async function api(action, extra = {}) {
  if (!C.api) throw new Error('Backend non configuré : ajoutez l\'URL Apps Script dans js/config.js (api).');
  const r = await fetch(C.api, { method: 'POST', body: JSON.stringify(Object.assign({ action, pin }, extra)) });
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Erreur');
  return j;
}
const waTel = t => { let d = String(t || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '212' + d.slice(1); return d; };

/* login */
function login(msg = '') {
  app.innerHTML = `<form class="login" id="lf"><div class="mark"><img src="img/ui/logo.png" alt=""></div><h1 style="font-size:22px">Espace admin</h1><p style="color:var(--muted);margin:4px 0 0">${esc(C.shop)}</p>
    <input id="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••••" aria-label="Code admin" required>
    <p class="err" id="lerr">${esc(msg)}</p><button class="btn block" type="submit">Se connecter</button>
    <p style="margin-top:18px"><a href="./" style="color:var(--blue);font-weight:700">← Retour au catalogue</a></p></form>`;
  $('#pin').focus();
  $('#lf').onsubmit = async e => {
    e.preventDefault(); pin = $('#pin').value.trim(); const b = $('button', e.target); b.disabled = true; b.textContent = 'Connexion…';
    try { await api('login'); ss.set('yd_pin', pin); await load(); }
    catch (err) { pin = null; ss.set('yd_pin', null); $('#lerr').textContent = err.message; b.disabled = false; b.textContent = 'Se connecter'; }
  };
}
async function load() {
  try { const j = await api('orders'); D.orders = j.orders; D.products = j.products; render(); }
  catch (err) { if (/code|essais/i.test(err.message)) { ss.set('yd_pin', null); login(err.message); } else { app.innerHTML = `<div class="empty"><div class="ico">⚠️</div><h3>${esc(err.message)}</h3><button class="btn" onclick="location.reload()">Réessayer</button></div>`; } }
}

/* layout */
function render() {
  const sc = scrollY;
  app.innerHTML = `<header class="topbar"><h1>Admin · ${esc(C.shop)}</h1><button class="iconbtn" data-act="reload" aria-label="Actualiser"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/></svg></button><button class="iconbtn" data-act="logout" aria-label="Déconnexion"><svg viewBox="0 0 24 24"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg></button></header>
    <nav class="tabs">${[['orders', 'Commandes'], ['products', 'Produits'], ['stats', 'Stats']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</nav>
    <div id="body">${tab === 'orders' ? ordersHTML() : tab === 'products' ? productsHTML() : statsHTML()}</div>`;
  scrollTo(0, sc);
  if (tab === 'products') bindProducts();
}

/* orders */
function ordersHTML() {
  const cnt = s => D.orders.filter(o => s === 'toutes' || o.status === s).length;
  const list = D.orders.filter(o => filter === 'toutes' || o.status === filter);
  return `<div class="filters">${['toutes', ...STATUS].map(s => `<button class="${filter === s ? 'on' : ''}" data-filter="${s}">${s[0].toUpperCase() + s.slice(1)} (${cnt(s)})</button>`).join('')}</div>
  <div class="list">${list.length ? list.map(o => `<div class="order"><header><b>${esc(o.num)}</b><span class="st st-${esc(o.status.replace(/ /g, '-'))}">${esc(o.status)}</span></header>
    <div class="meta">${new Date(o.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>
    <p style="margin:0;font-weight:700">${esc(o.client.nom)}${o.client.cabinet ? ' · ' + esc(o.client.cabinet) : ''}</p>
    <p style="margin:2px 0 0;font-size:13px;color:var(--muted)">📍 ${esc(o.client.adresse)}, ${esc(o.client.ville)}</p>
    ${o.client.remarque ? `<p style="margin:2px 0 0;font-size:13px">📝 ${esc(o.client.remarque)}</p>` : ''}
    <div class="items">${o.items.map(i => `<div><span>${i.q} × ${esc(i.name)}${i.label ? ' (' + esc(i.label) + ')' : ''}</span><b>${i.p == null ? 'sur dem.' : fmt(i.p * i.q)}</b></div>`).join('')}</div>
    <div class="row"><span>Total</span><span class="price">${fmt(o.total)}</span></div>
    <div class="acts"><select data-status="${esc(o.num)}" aria-label="Statut">${STATUS.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <a class="btn green sm" href="https://wa.me/${waTel(o.client.tel)}?text=${encodeURIComponent(`Bonjour ${o.client.nom}, ${C.shop} concernant votre commande ${o.num}.`)}" target="_blank" rel="noopener" aria-label="WhatsApp client">WhatsApp</a>
      <a class="btn ghost sm" href="tel:${esc(String(o.client.tel).replace(/[^\d+]/g, ''))}" aria-label="Appeler">📞</a></div></div>`).join('') : '<div class="empty"><div class="ico">📭</div><h3>Aucune commande</h3></div>'}</div>`;
}

/* products */
function productsHTML() {
  const list = D.products.filter(p => !pq || norm(p.name + ' ' + p.id).includes(norm(pq)));
  return `<input class="search" id="pq" placeholder="Rechercher un produit…" value="${esc(pq)}" aria-label="Rechercher">
  <div class="list" id="plist">${list.slice(0, 120).map(prodHTML).join('')}${list.length > 120 ? `<p style="color:var(--muted);text-align:center">+${list.length - 120} — affinez la recherche</p>` : ''}</div>`;
}
function prodHTML(p) {
  const rows = p.v ? p.v : null;
  return `<div class="prod" data-id="${esc(p.id)}"><img src="img/p/${encodeURIComponent(p.id)}.webp?v=2" alt="" loading="lazy" onerror="this.src='img/ui/logo.png'"><div class="mid"><b>${esc(p.name)}</b><small style="color:var(--muted)">${esc(p.u || '')}</small>
    <div class="opts">${rows ? rows.map(o => `<div class="o"><input class="l" value="${esc(o.l)}" aria-label="Option"><input class="p" inputmode="decimal" value="${o.p ?? ''}" placeholder="sur dem." aria-label="Prix"></div>`).join('') :
      `<div class="o"><input class="p" style="max-width:none" inputmode="decimal" value="${p.p ?? ''}" placeholder="Prix sur demande" aria-label="Prix"></div>`}</div>
    <button class="btn ghost sm" style="margin-top:6px;height:32px" data-addopt>+ option</button>
    <label class="switch"><input type="checkbox" data-dispo ${p.dispo !== false ? 'checked' : ''}> <span>${p.dispo !== false ? 'Disponible' : 'Rupture'}</span></label>
    <button class="btn sm save" data-save hidden>Enregistrer</button></div></div>`;
}
function readProd(el) {
  const p = D.products.find(x => x.id === el.dataset.id), out = { id: p.id, u: p.u, dispo: $('[data-dispo]', el).checked };
  const opts = $$('.o', el).map(o => ({ l: $('.l', o) ? $('.l', o).value.trim() : null, p: $('.p', o).value.trim().replace(',', '.') }));
  if (opts.some(o => o.l !== null)) out.v = opts.filter(o => o.l).map(o => ({ l: o.l, p: o.p === '' ? null : Number(o.p) }));
  else out.p = opts[0].p === '' ? null : Number(opts[0].p);
  return out;
}
async function saveProd(el) {
  const data = readProd(el);
  if ((data.v || []).some(o => o.p != null && !(o.p >= 0)) || (data.p != null && !(data.p >= 0))) { toast('Prix invalide'); return; }
  try {
    const j = await api('updateProduct', { product: data });
    const i = D.products.findIndex(x => x.id === data.id); D.products[i] = j.product;
    el.outerHTML = prodHTML(j.product); bindProducts(); toast('Enregistré ✓');
  } catch (err) { toast(err.message); }
}
function bindProducts() {
  const q = $('#pq'); if (q) q.oninput = () => { pq = q.value; $('#plist').innerHTML = productsHTML().split('<div class="list" id="plist">')[1].replace(/<\/div>$/, ''); bindProducts(); };
  $$('.prod').forEach(el => {
    el.oninput = e => { if (e.target.matches('input:not([data-dispo])')) $('[data-save]', el).hidden = false; };
    $('[data-dispo]', el).onchange = e => { $('span', e.target.parentNode).textContent = e.target.checked ? 'Disponible' : 'Rupture'; saveProd(el); };
    $('[data-save]', el).onclick = () => saveProd(el);
    $('[data-addopt]', el).onclick = () => {
      const box = $('.opts', el); const single = $('.o .p', box);
      if (!$('.l', box)) box.innerHTML = `<div class="o"><input class="l" placeholder="Option" value="Standard" aria-label="Option"><input class="p" inputmode="decimal" value="${single ? esc(single.value) : ''}" aria-label="Prix"></div>`;
      box.insertAdjacentHTML('beforeend', '<div class="o"><input class="l" placeholder="Nouvelle option" aria-label="Option"><input class="p" inputmode="decimal" placeholder="Prix" aria-label="Prix"></div>');
      $('[data-save]', el).hidden = false; $$('.l', box).pop().focus();
    };
  });
}

/* stats */
function statsHTML() {
  const ok = D.orders.filter(o => o.status !== 'annulée'), now = new Date();
  const same = (d, f) => { d = new Date(d); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && (!f || d.getDate() === now.getDate()); };
  const day = ok.filter(o => same(o.date, 1)), month = ok.filter(o => same(o.date));
  const sum = l => l.reduce((s, o) => s + (o.total || 0), 0);
  const top = {}, city = {};
  ok.forEach(o => { o.items.forEach(i => { top[i.name] = (top[i.name] || 0) + i.q; }); const v = (o.client.ville || '—').trim(); city[v] = (city[v] || 0) + o.total; });
  const bars = (obj, f) => { const e = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 8), m = e.length ? e[0][1] : 1; return e.length ? e.map(([k, v]) => `<div class="bar"><div><span>${esc(k)}</span><b>${f(v)}</b></div><i style="width:${Math.max(4, v / m * 100)}%"></i></div>`).join('') : '<p style="color:var(--muted)">Pas encore de données</p>'; };
  return `<div class="kpis"><div class="kpi"><small>CA du jour</small><b>${fmt(sum(day))}</b><small>${day.length} commande(s)</small></div>
    <div class="kpi"><small>CA du mois</small><b>${fmt(sum(month))}</b><small>${month.length} commande(s)</small></div>
    <div class="kpi"><small>Panier moyen</small><b>${fmt(ok.length ? sum(ok) / ok.length : 0)}</b><small>hors annulées</small></div>
    <div class="kpi"><small>Total commandes</small><b>${D.orders.length}</b><small>${D.orders.filter(o => o.status === 'nouvelle').length} nouvelle(s)</small></div></div>
    <div class="bars"><h3>Top produits (quantités)</h3>${bars(top, v => v)}</div>
    <div class="bars"><h3>CA par ville</h3>${bars(city, fmt)}</div>`;
}

/* events */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab],[data-filter],[data-act]'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; render(); scrollTo(0, 0); }
  else if (t.dataset.filter) { filter = t.dataset.filter; render(); }
  else if (t.dataset.act === 'reload') load().then(() => toast('Actualisé ✓'));
  else if (t.dataset.act === 'logout') { ss.set('yd_pin', null); pin = null; login(); }
});
document.addEventListener('change', async e => {
  const s = e.target.closest('[data-status]'); if (!s) return;
  s.disabled = true;
  try { await api('setStatus', { num: s.dataset.status, status: s.value }); D.orders.find(o => o.num === s.dataset.status).status = s.value; render(); toast('Statut mis à jour ✓'); }
  catch (err) { toast(err.message); s.disabled = false; }
});
pin ? load() : login(C.api ? '' : 'Backend non configuré (js/config.js → api)');
})();
