// Réglages de la boutique — c'est le seul fichier à modifier pour changer les infos.
window.CFG = {
  shop: 'Yousf Dent',
  tagline: 'Consommables et matériel dentaires',
  address: '72 Rue Bni Drar, Tabriquet, Salé',
  whatsapp: '212663155192',          // numéro des commandes (format international, sans +)
  phone: '06 63 15 51 92',
  contacts: [
    { zone: 'Rabat & Témara', name: 'Mustapha', tel: '0662470115' },
    { zone: 'Salé & Salé El Jadida', name: 'Imad', tel: '0663574900' },
    { zone: 'Gérant', name: 'Youssef', tel: '0663155192' }
  ],
  orderPrefix: 'YD',                 // numéro de commande : YD-AAMMJJ-001
  site: 'https://glow-dental.vercel.app',
  // URL de l'application Web Apps Script (backend/Code.gs). Vide = le site marche sans Google Sheet.
  api: ''
};
