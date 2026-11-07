/**
 * Yousf Dent — Backend Google Sheet (Apps Script)
 *
 * ===== TATBIQ (INSTALLATION) — b darija =====
 * 1) Dkhol l Google Drive → Nouveau → Google Sheets. Smmiha "Yousf Dent — Commandes".
 * 2) F Sheet: Extensions → Apps Script. Ms7 dakchi li kayn w lsse9 had l-fichier kamel.
 *    (Ila bghiti: Paramètres du projet → coche "Afficher appsscript.json" w 7ett fih l-contenu dyal backend/appsscript.json)
 * 3) F Apps Script: Paramètres du projet (⚙️) → Propriétés du script → Ajouter :
 *      ADMIN_PIN        = code dyal l-admin (ex: 6 ar9am). MATKTBOHCH F GITHUB ABADAN.
 *      SITE_URL         = https://glow-dental-three.vercel.app   (l-URL dyal site)
 *      NOTIFY_EMAIL     = (ikhtiyari) email bach yjik message f kol commande
 *      CALLMEBOT_PHONE  = (ikhtiyari) ra9m WhatsApp dyalek b 212… (CallMeBot)
 *      CALLMEBOT_KEY    = (ikhtiyari) l-apikey li kat3tik CallMeBot
 *      NTFY_TOPIC       = (ikhtiyari) smiya dyal topic f l'application ntfy (ex: yousfdent-cmd-8291)
 * 4) Khtar fonction "setup" f l-fo9 w brek ▶ Exécuter. 3ti l-autorisations.
 *    Ghadi ytsaybo 3 dyal les feuilles: Produits, Commandes, Clients, w ytjabo les produits mn site.
 * 5) Déployer → Nouveau déploiement → Type: Application Web
 *      Exécuter en tant que: Moi   |   Qui a accès: Tout le monde
 *    Copier l-URL li katsali b /exec.
 * 6) 7ell js/config.js f site w 7ett had l-URL f  api: '...'  → push l GitHub.
 * 7) Ila bdlti chi 7aja f had l-code: Déployer → Gérer les déploiements → ✏️ → Version: Nouvelle version.
 *
 * Feuille "Produits": tqdr tbddel l-prix, les options w "dispo" (TRUE/FALSE) nichan mn Sheet,
 *   site kayqrahom automatiquement. Options b had chkl:  5 cm=125 | 7,5 cm=190
 *   Prix khawi = "Prix sur demande".
 */

const PREFIX = 'YD';
const STATUSES = ['nouvelle', 'confirmée', 'en livraison', 'livrée', 'annulée'];
const SH_P = 'Produits', SH_O = 'Commandes', SH_C = 'Clients';
const HEAD_P = ['id', 'nom', 'categorie', 'prix', 'options', 'conditionnement', 'dispo'];
const HEAD_O = ['numero', 'date', 'statut', 'nom', 'cabinet', 'telephone', 'ville', 'adresse', 'remarque', 'articles', 'total', 'articles_json'];
const HEAD_C = ['telephone', 'nom', 'cabinet', 'ville', 'adresse', 'nb_commandes', 'total_achats', 'derniere_commande'];

const props = () => PropertiesService.getScriptProperties();
const ss = () => SpreadsheetApp.getActiveSpreadsheet();
const json = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

/* ---------- setup (exécuter une seule fois) ---------- */
function setup() {
  const book = ss();
  [[SH_P, HEAD_P], [SH_O, HEAD_O], [SH_C, HEAD_C]].forEach(([name, head]) => {
    const sh = book.getSheetByName(name) || book.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#0A2A66').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  const st = book.getSheetByName(SH_O);
  st.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());

  const site = (props().getProperty('SITE_URL') || '').replace(/\/$/, '');
  if (!site) throw new Error('Zid SITE_URL f Propriétés du script 9bel setup.');
  const data = JSON.parse(UrlFetchApp.fetch(site + '/data/products.json').getContentText());
  const shp = book.getSheetByName(SH_P);
  if (shp.getLastRow() > 1) shp.getRange(2, 1, shp.getLastRow() - 1, HEAD_P.length).clearContent();
  const rows = data.products.map(p => [p.id, p.name, p.cat, p.v ? '' : (p.p == null ? '' : p.p), p.v ? optsToText(p.v) : '', p.u || '', p.dispo !== false]);
  shp.getRange(2, 1, rows.length, HEAD_P.length).setValues(rows);
  shp.getRange(2, 7, rows.length, 1).insertCheckboxes();
  shp.autoResizeColumns(1, 3);
  if (!props().getProperty('ADMIN_PIN')) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    props().setProperty('ADMIN_PIN', pin);
    Logger.log('ADMIN_PIN tsawb automatiquement: ' + pin + ' (tqdr tbddlo f Propriétés du script)');
  }
  Logger.log(rows.length + ' produits importés ✓');
}

/* ---------- helpers ---------- */
function optsToText(v) { return v.map(o => o.l + '=' + (o.p == null ? '' : o.p)).join(' | '); }
function textToOpts(t) {
  return String(t || '').split('|').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.lastIndexOf('='); const l = (i < 0 ? s : s.slice(0, i)).trim(); const n = i < 0 ? '' : s.slice(i + 1).trim();
    return { l: l, p: n === '' ? null : Number(String(n).replace(',', '.')) };
  });
}
function num(v) { return v === '' || v == null || isNaN(Number(v)) ? null : Number(v); }
function readProducts() {
  const sh = ss().getSheetByName(SH_P); if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEAD_P.length).getValues().filter(r => r[0]).map((r, i) => {
    const p = { id: String(r[0]), name: String(r[1]), cat: String(r[2]), dispo: r[6] === true || String(r[6]).toUpperCase() === 'TRUE', _row: i + 2 };
    const v = textToOpts(r[4]); if (v.length) p.v = v; else p.p = num(r[3]);
    if (r[5]) p.u = String(r[5]);
    return p;
  });
}
const publicProduct = p => { const o = Object.assign({}, p); delete o._row; return o; };
const digits = t => String(t || '').replace(/\D/g, '').slice(-9);
function sheetRows(name, head) {
  const sh = ss().getSheetByName(name); if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getValues();
}
function checkPin(pin) {
  const cache = CacheService.getScriptCache(), fails = Number(cache.get('pin_fails') || 0);
  if (fails >= 10) throw new Error('Trop d\'essais. Réessayez dans 10 minutes.');
  const real = props().getProperty('ADMIN_PIN');
  if (!real || String(pin) !== real) { cache.put('pin_fails', String(fails + 1), 600); throw new Error('Code incorrect'); }
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200);

/* ---------- GET ---------- */
function doGet(e) {
  try {
    const a = (e.parameter || {}).action;
    if (a === 'products') return json({ ok: true, products: readProducts().map(publicProduct) });
    if (a === 'status') {
      const n = clean(e.parameter.num, 40), t = digits(e.parameter.tel);
      const r = sheetRows(SH_O, HEAD_O).find(r => r[0] === n && digits(r[5]) === t);
      return json(r ? { ok: true, num: n, status: r[2] } : { ok: false, error: 'introuvable' });
    }
    return json({ ok: true, service: 'Yousf Dent API' });
  } catch (err) { return json({ ok: false, error: String(err.message || err) }); }
}

/* ---------- POST ---------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'JSON invalide' }); }
  try {
    switch (body.action) {
      case 'order': return json(createOrder(body));
      case 'login': checkPin(body.pin); return json({ ok: true });
      case 'orders': checkPin(body.pin); return json({ ok: true, orders: listOrders(), products: readProducts().map(publicProduct) });
      case 'setStatus': checkPin(body.pin); return json(setStatus(body.num, body.status));
      case 'updateProduct': checkPin(body.pin); return json(updateProduct(body.product));
      default: return json({ ok: false, error: 'action inconnue' });
    }
  } catch (err) { return json({ ok: false, error: String(err.message || err) }); }
}

function createOrder(body) {
  const c = body.client || {};
  const client = { nom: clean(c.nom, 80), cabinet: clean(c.cabinet, 80), tel: clean(c.tel, 20), ville: clean(c.ville, 60), adresse: clean(c.adresse, 200), remarque: clean(c.remarque, 500) };
  if (!client.nom || !client.ville || !client.adresse) throw new Error('Coordonnées incomplètes');
  if (!/^(?:\+?212|0)[5-7]\d{8}$/.test(client.tel.replace(/[\s.\-()]/g, ''))) throw new Error('Téléphone invalide');
  const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  if (!items.length) throw new Error('Panier vide');

  // Total recalculé côté serveur avec les prix de la feuille Produits
  const by = {}; readProducts().forEach(p => by[p.id] = p);
  let total = 0; const lines = [];
  items.forEach(it => {
    const p = by[it.id]; const q = Math.max(1, Math.min(999, Math.floor(Number(it.q) || 0)));
    if (!p || !p.dispo) return;
    const vi = p.v ? Math.max(0, Math.min(p.v.length - 1, Math.floor(Number(it.vi) || 0))) : 0;
    const price = p.v ? p.v[vi].p : p.p;
    if (price != null) total += price * q;
    lines.push({ id: p.id, vi: vi, q: q, name: p.name, label: p.v ? p.v[vi].l : '', p: price });
  });
  if (!lines.length) throw new Error('Aucun produit disponible dans le panier');

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let number;
  try {
    const tz = ss().getSpreadsheetTimeZone() || 'Africa/Casablanca';
    const ymd = Utilities.formatDate(new Date(), tz, 'yyMMdd');
    const k = 'SEQ_' + ymd, seq = Number(props().getProperty(k) || 0) + 1;
    props().setProperty(k, String(seq));
    number = PREFIX + '-' + ymd + '-' + ('00' + seq).slice(-3);
    const txt = lines.map(l => l.q + ' × ' + l.name + (l.label ? ' (' + l.label + ')' : '') + (l.p == null ? ' — sur demande' : ' — ' + l.p * l.q + ' DH')).join('\n');
    ss().getSheetByName(SH_O).appendRow([number, new Date(), 'nouvelle', client.nom, client.cabinet, "'" + client.tel, client.ville, client.adresse, client.remarque, txt, total, JSON.stringify(lines)]);
    upsertClient(client, total);
  } finally { lock.releaseLock(); }
  notify(number, client, lines, total);
  return { ok: true, num: number, total: total };
}

function upsertClient(c, total) {
  const sh = ss().getSheetByName(SH_C), rows = sheetRows(SH_C, HEAD_C), t = digits(c.tel);
  const i = rows.findIndex(r => digits(r[0]) === t);
  if (i < 0) sh.appendRow(["'" + c.tel, c.nom, c.cabinet, c.ville, c.adresse, 1, total, new Date()]);
  else {
    const r = rows[i];
    sh.getRange(i + 2, 1, 1, HEAD_C.length).setValues([["'" + c.tel, c.nom, c.cabinet || r[2], c.ville, c.adresse, Number(r[5] || 0) + 1, Number(r[6] || 0) + total, new Date()]]);
  }
}

function notify(number, c, lines, total) {
  const p = props();
  const msg = 'Nouvelle commande ' + number + '\n' + c.nom + (c.cabinet ? ' — ' + c.cabinet : '') + '\n' + c.tel + '\n' + c.ville + ', ' + c.adresse +
    '\n\n' + lines.map(l => '• ' + l.q + ' × ' + l.name + (l.label ? ' (' + l.label + ')' : '')).join('\n') + '\n\nTotal : ' + total + ' DH' + (c.remarque ? '\nRemarque : ' + c.remarque : '');
  const mail = p.getProperty('NOTIFY_EMAIL');
  if (mail) try { MailApp.sendEmail(mail, '🦷 Commande ' + number + ' — ' + total + ' DH', msg); } catch (e) { Logger.log(e); }
  const cbPhone = p.getProperty('CALLMEBOT_PHONE'), cbKey = p.getProperty('CALLMEBOT_KEY');
  if (cbPhone && cbKey) try { UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(cbPhone) + '&text=' + encodeURIComponent(msg) + '&apikey=' + encodeURIComponent(cbKey), { muteHttpExceptions: true }); } catch (e) { Logger.log(e); }
  const topic = p.getProperty('NTFY_TOPIC');
  if (topic) try { UrlFetchApp.fetch('https://ntfy.sh/' + encodeURIComponent(topic), { method: 'post', payload: msg, headers: { Title: 'Commande ' + number + ' - ' + total + ' DH' }, muteHttpExceptions: true }); } catch (e) { Logger.log(e); }
}

/* ---------- admin ---------- */
function listOrders() {
  return sheetRows(SH_O, HEAD_O).map(r => {
    let items = []; try { items = JSON.parse(r[11] || '[]'); } catch (e) {}
    return { num: r[0], date: r[1] instanceof Date ? r[1].toISOString() : String(r[1]), status: r[2], client: { nom: r[3], cabinet: r[4], tel: String(r[5]), ville: r[6], adresse: r[7], remarque: r[8] }, total: Number(r[10]) || 0, items: items };
  }).reverse().slice(0, 1000);
}
function setStatus(n, status) {
  if (STATUSES.indexOf(status) < 0) throw new Error('Statut invalide');
  const rows = sheetRows(SH_O, HEAD_O), i = rows.findIndex(r => r[0] === n);
  if (i < 0) throw new Error('Commande introuvable');
  ss().getSheetByName(SH_O).getRange(i + 2, 3).setValue(status);
  return { ok: true, num: n, status: status };
}
function updateProduct(p) {
  const cur = readProducts().find(x => x.id === (p && p.id)); if (!cur) throw new Error('Produit introuvable');
  const sh = ss().getSheetByName(SH_P);
  const v = Array.isArray(p.v) && p.v.length ? p.v.map(o => ({ l: clean(o.l, 60), p: num(o.p) })).filter(o => o.l) : null;
  sh.getRange(cur._row, 4, 1, 4).setValues([[v ? '' : (num(p.p) == null ? '' : num(p.p)), v ? optsToText(v) : '', p.u != null ? clean(p.u, 80) : (cur.u || ''), p.dispo !== false]]);
  return { ok: true, product: publicProduct(readProducts().find(x => x.id === cur.id)) };
}

/* Test rapide f l-éditeur: khtar testOrder w exécuter (kaysayb commande dyal test). */
function testOrder() {
  Logger.log(createOrder({ client: { nom: 'Test', tel: '0612345678', ville: 'Salé', adresse: 'Test' }, items: [{ id: 'masque', q: 2 }] }));
}
