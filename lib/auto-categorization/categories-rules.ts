/**
 * CATEGORII PREDEFINITE (SISTEM)
 *
 * Lista celor 12 categorii implicite create automat pentru fiecare utilizator nou.
 * Aceste categorii acoperă cele mai comune tipuri de tranzacții bancare.
 *
 * TIPURI:
 * - "expense" = cheltuială
 * - "income"  = venit
 * - "transfer" = transfer intern între conturi
 */

export interface DefaultCategory {
  name: string;
  type: "income" | "expense" | "transfer";
  icon: string;
  description: string;
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // --- VENITURI ---
  {
    name: "Venituri Clienți",
    type: "income",
    icon: "💅",
    description: "Plăți de la clientele salonului (nume persoane, transfer direct)",
  },
  {
    name: "Venituri Universeoftware",
    type: "income",
    icon: "📲",
    description: "Plăți din aplicația de programări Universeoftware",
  },
  {
    name: "Venituri",
    type: "income",
    icon: "💰",
    description: "Alte venituri: freelance, dividende, surse diverse",
  },

  // --- CHELTUIELI SALON ---
  {
    name: "Chirie Salon",
    type: "expense",
    icon: "🏪",
    description: "Chiria lunară a salonului",
  },
  {
    name: "Produse Salon",
    type: "expense",
    icon: "🧴",
    description: "Produse pentru extensii gene, farmacie, site-uri beauty",
  },
  {
    name: "Produse Estetică",
    type: "expense",
    icon: "💉",
    description: "Seringi, acid hialuronic, botox, produse estetică medicală",
  },
  {
    name: "eBay",
    type: "expense",
    icon: "🛍️",
    description: "Cumpărături produse de pe eBay",
  },
  {
    name: "AliExpress",
    type: "expense",
    icon: "📦",
    description: "Cumpărături produse de pe AliExpress",
  },
  {
    name: "Gunoi Medical",
    type: "expense",
    icon: "🧹",
    description: "Colectare deșeuri medicale/sanitare salon",
  },
  {
    name: "Software & Apps",
    type: "expense",
    icon: "💻",
    description: "Universeoftware, Google, Apple, subscripții business",
  },
  {
    name: "Aplicație Booking",
    type: "expense",
    icon: "📅",
    description: "Abonament aplicație de programări pentru salon",
  },
  {
    name: "Abonamente Lunare",
    type: "expense",
    icon: "🔁",
    description: "Abonamente lunare diverse: Netflix, Spotify, servicii online",
  },
  {
    name: "Colectare Deșeuri",
    type: "expense",
    icon: "🗑️",
    description: "Compania de colectare gunoi medical/salon",
  },
  {
    name: "Contabilitate",
    type: "expense",
    icon: "📋",
    description: "Plata anuală/lunară a contabilului",
  },

  // --- CHELTUIELI PERSONALE / GOSPODĂRIE ---
  {
    name: "Utilități",
    type: "expense",
    icon: "⚡",
    description: "Council Tax, gaz, electric, apă",
  },
  {
    name: "Telefon & Mobile",
    type: "expense",
    icon: "📱",
    description: "GiffGaff, abonament mobil lunar",
  },
  {
    name: "Transport",
    type: "expense",
    icon: "🚗",
    description: "Benzină, taxi, Uber, metrou, parcări",
  },
  {
    name: "Mâncare & Băuturi",
    type: "expense",
    icon: "🍽️",
    description: "Supermarket, restaurante, cafenele",
  },
  {
    name: "Sănătate",
    type: "expense",
    icon: "🏥",
    description: "Medicamente, consultații, analize medicale",
  },
  {
    name: "Farmacie",
    type: "expense",
    icon: "💊",
    description: "Medicamente, suplimente, produse farmaceutice",
  },
  {
    name: "Educație",
    type: "expense",
    icon: "📚",
    description: "Cursuri, cărți, formare profesională",
  },
  {
    name: "Cash",
    type: "expense",
    icon: "💵",
    description: "Retrageri ATM și plăți cash",
  },
  {
    name: "Taxe și Impozite",
    type: "expense",
    icon: "🏛️",
    description: "Impozite, taxe guvernamentale, National Insurance",
  },
  {
    name: "Alte Cheltuieli",
    type: "expense",
    icon: "📦",
    description: "Cheltuieli diverse necategorizate",
  },

  // --- TRANSFERURI ---
  {
    name: "Transfer Intern",
    type: "transfer",
    icon: "🔄",
    description: "Transferuri între propriile conturi bancare",
  },
  {
    name: "Transferuri",
    type: "transfer",
    icon: "↔️",
    description: "Transferuri către alte persoane",
  },
];

export function getAllCategories(): DefaultCategory[] {
  return DEFAULT_CATEGORIES;
}
