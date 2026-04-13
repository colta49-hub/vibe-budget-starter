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
    name: "Venituri",
    type: "income",
    icon: "💰",
    description: "Salarii, freelance, dividende și alte surse de venit",
  },

  // --- CHELTUIELI ---
  {
    name: "Transport",
    type: "expense",
    icon: "🚗",
    description: "Benzină, taxi, metrou, parcări, bilete",
  },
  {
    name: "Cumpărături",
    type: "expense",
    icon: "🛒",
    description: "Supermarket, magazine, online shopping",
  },
  {
    name: "Locuință",
    type: "expense",
    icon: "🏠",
    description: "Chirie, utilități, internet, telefon fix",
  },
  {
    name: "Sănătate",
    type: "expense",
    icon: "🏥",
    description: "Medicamente, consultații, analize medicale",
  },
  {
    name: "Divertisment",
    type: "expense",
    icon: "🎬",
    description: "Cinema, restaurante, cafenele, ieșiri",
  },
  {
    name: "Subscripții",
    type: "expense",
    icon: "📱",
    description: "Netflix, Spotify, Adobe, alte abonamente lunare",
  },
  {
    name: "Educație",
    type: "expense",
    icon: "📚",
    description: "Cursuri, cărți, tutoriale, școală",
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
    description: "Impozite, taxe guvernamentale, contribuții",
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
