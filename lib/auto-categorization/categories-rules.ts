/**
 * CATEGORII PREDEFINITE (SISTEM) — UK Self-Employed / SA103F
 *
 * Categorii aliniate la HMRC Self Assessment SA103F.
 * Create automat pentru fiecare utilizator nou.
 *
 * TIPURI:
 * - "expense" = cheltuială deductibilă fiscal
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
    name: "Income",
    type: "income",
    icon: "💰",
    description: "Self-employment income, client payments, invoices",
  },
  {
    name: "Client Transfer",
    type: "income",
    icon: "🔄",
    description: "Bank transfers received from clients",
  },

  // --- CHELTUIELI DEDUCTIBILE UK (SA103F) ---
  {
    name: "Office & Supplies",
    type: "expense",
    icon: "🏢",
    description: "Stationery, printer ink, postage, software subscriptions, cloud storage",
  },
  {
    name: "Phone & Internet",
    type: "expense",
    icon: "📱",
    description: "Business mobile phone, broadband, internet costs",
  },
  {
    name: "Travel & Transport",
    type: "expense",
    icon: "🚗",
    description: "Business mileage, fuel, public transport, parking, taxis",
  },
  {
    name: "Meals & Subsistence",
    type: "expense",
    icon: "🍽️",
    description: "Business meals, subsistence while travelling for work",
  },
  {
    name: "Health & Wellbeing",
    type: "expense",
    icon: "🏥",
    description: "Business-related health costs, medical supplies",
  },
  {
    name: "Marketing & Advertising",
    type: "expense",
    icon: "📢",
    description: "Website, social media ads, flyers, business cards, directories",
  },
  {
    name: "Training & Education",
    type: "expense",
    icon: "🎓",
    description: "Courses, conferences, seminars, professional development",
  },
  {
    name: "Professional Services",
    type: "expense",
    icon: "💼",
    description: "Accountant, solicitor, consultant fees",
  },
  {
    name: "Subscriptions",
    type: "expense",
    icon: "🔁",
    description: "Software subscriptions, professional memberships, trade journals",
  },
  {
    name: "Bank Charges & Fees",
    type: "expense",
    icon: "🏦",
    description: "Bank account fees, Stripe/PayPal fees, credit card charges",
  },
  {
    name: "Rent & Office",
    type: "expense",
    icon: "🏠",
    description: "Business premises rent, co-working space, home office costs",
  },
  {
    name: "Stock & Materials",
    type: "expense",
    icon: "🛍️",
    description: "Products, raw materials, goods for resale (eBay, Amazon, AliExpress)",
  },
  {
    name: "Taxes & Duties",
    type: "expense",
    icon: "🏛️",
    description: "National Insurance, VAT, council tax, other government duties",
  },
  {
    name: "Uncategorized",
    type: "expense",
    icon: "❓",
    description: "Expenses not yet assigned to a category",
  },

  // --- TRANSFERURI ---
  {
    name: "Internal Transfer",
    type: "transfer",
    icon: "↔️",
    description: "Transfers between your own bank accounts",
  },
];

export function getAllCategories(): DefaultCategory[] {
  return DEFAULT_CATEGORIES;
}
