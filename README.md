# Yousf Dent — catalogue & commandes WhatsApp

Site catalogue mobile-first (HTML/CSS/JS vanilla, sans framework), PWA hors-ligne, commande en 3 étapes vers WhatsApp, backend Google Sheet optionnel et espace admin.

## Structure
| Dossier / fichier | Rôle |
|---|---|
| `index.html`, `css/`, `js/app.js` | Le site (catalogue, recherche, fiche produit, panier, commandes) |
| `js/config.js` | **Seul fichier à modifier** : WhatsApp, adresse, URL du site, URL du backend (`api`) |
| `data/products.json` | 285 produits extraits du catalogue PDF (`id, name, cat, p` ou `v:[{l,p}], u, dispo`) |
| `img/p/*.webp` | Photos produits (340 px, fond blanc) |
| `admin.html`, `js/admin.js` | Admin : commandes, produits (prix, options, dispo), stats |
| `backend/Code.gs` | Apps Script (Google Sheet) — instructions d'installation en darija en haut du fichier |
| `print/` | Affiche A4 (PDF + PNG), sticker 10×10 cm, story 1080×1920, et `affiches.html` pour les régénérer |
| `og.jpg` | Image de partage 1200×630 |

## Mise en ligne
- Vercel : *Add New → Project → Import* le repo GitHub, sans build (site statique). Chaque push sur `main` redéploie.
- Backend : suivre les étapes en tête de `backend/Code.gs`, puis coller l'URL `/exec` dans `js/config.js` → `api`.
- Sans backend, le site fonctionne quand même : les commandes partent sur WhatsApp et l'historique reste dans le téléphone du client.

## Mettre à jour
- Prix / disponibilité : dans la feuille **Produits** (ou l'admin) une fois le backend branché.
- Après une modification du code, changer `VERSION` dans `sw.js` pour que les téléphones prennent la nouvelle version.
- Affiches : ouvrir `https://<votre-site>/print/affiches.html?f=a4` (ou `sticker`, `story`) puis imprimer — le QR pointe automatiquement vers l'adresse du site.

## Crédits
Polices Plus Jakarta Sans et Cairo (SIL OFL, voir `fonts/`). Générateur QR : qrcode-generator de Kazuhiko Arase (MIT, `print/qrcode.js`).
