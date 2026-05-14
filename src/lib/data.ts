import { Category, Option } from "@/types";

export const ORDER_TYPES: Option[] = [
  { id: "takeaway", name: "À Emporter", price: 0, description: "Prêt dans un sac biodégradable" },
  { id: "on_site", name: "Sur Place", price: 0, description: "Servi sur plateau réutilisable" },
];

export const FORMULAS: Option[] = [
  { id: "sandwich_only", name: "Sandwich Seul", price: 10.00, description: "Le sandwich de votre choix" },
  { id: "menu_standard", name: "Menu Complet", price: 15.00, description: "Sandwich + Boisson + Dessert" },
  { id: "menu_student", name: "Menu Étudiant", price: 13.00, description: "Sandwich + Boisson + Frites (Justificatif requis)" },
  { id: "menu_kids", name: "Menu Enfant", price: 8.00, description: "Mini Sandwich + Jus + Surprise" },
];

export const CREATION_MODES: Option[] = [
  { id: "signature", name: "Les Créations du Chef", price: 0, description: "Recettes signatures prêtes à déguster" },
  { id: "custom", name: "Sur Mesure", price: 0, description: "Composez votre sandwich idéal" },
];

export const SANDWICH_CATEGORIES: Category[] = [
  {
    id: "presets",
    name: "Nos Signatures",
    options: [
      { id: "p1", name: "Le Gourmet", price: 15, description: "Bœuf Effiloché (12h), Maison Truffée, Cheddar Fondu" },
      { id: "p2", name: "L'Oriental", price: 14, description: "Pita, Poulet Grillé, Algérienne, Avocat" },
      { id: "p3", name: "Le Veggie Royal", price: 13, description: "Falafel Maison, Sauce Blanche, Oignons Frits" },
    ],
  },
  {
    id: "bread",
    name: "Le Pain",
    options: [
      { id: "b1", name: "Baguette Tradition", price: 0 },
      { id: "b2", name: "Pain Pita", price: 0 },
      { id: "b3", name: "Pain Brioché VIP", price: 1.5 },
    ],
  },
  {
    id: "meat",
    name: "La Viande",
    options: [
      { id: "m1", name: "Bœuf Effiloché (12h)", price: 5 },
      { id: "m2", name: "Poulet Grillé Mariné", price: 4 },
      { id: "m3", name: "Falafel Maison (Veggie)", price: 3.5 },
      { id: "m4", name: "Steak Boucher Frais", price: 4.5 },
    ],
  },
  {
    id: "sauces",
    name: "Les Sauces",
    options: [
      { id: "s1", name: "Algérienne", price: 0.5 },
      { id: "s2", name: "Blanche (Ail & Fines Herbes)", price: 0.5 },
      { id: "s3", name: "Samouraï", price: 0.5 },
      { id: "s4", name: "BBQ Fumée", price: 0.5 },
      { id: "s5", name: "Mayo-Moutarde", price: 0.5 },
      { id: "s6", name: "Maison Truffée", price: 0.5 },
    ],
  },
  {
    id: "extras",
    name: "Suppléments",
    options: [
      { id: "e1", name: "Cheddar Fondu", price: 1 },
      { id: "e2", name: "Oignons Frits", price: 0.5 },
      { id: "e3", name: "Bacon de Bœuf", price: 1.5 },
      { id: "e4", name: "Avocat", price: 2 },
    ],
  },
  {
    id: "drinks",
    name: "Boissons",
    options: [
      { id: "d1", name: "Coca-Cola Classic", price: 1.5 },
      { id: "d2", name: "Ice Tea Pêche", price: 1.5 },
      { id: "d3", name: "Eau Minérale (50cl)", price: 1 },
      { id: "d4", name: "Limonade Maison", price: 1.5 },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    options: [
      { id: "dess1", name: "Cookie Géant", price: 3 },
      { id: "dess2", name: "Tiramisu Spéculos", price: 4.5 },
      { id: "dess3", name: "Brownie Noix", price: 3.5 },
    ],
  },
];
