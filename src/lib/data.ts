import { Category, Option } from "@/types";

export const ORDER_TYPES: Option[] = [
  { id: "takeaway", name: "À Emporter", price: 0, description: "Prêt dans un sac biodégradable" },
  { id: "on_site", name: "Sur Place", price: 0, description: "Servi sur un plateau premium" },
];

export const FORMULAS: Option[] = [
  { id: "menu_standard", name: "Menu Complet", price: 15.0, description: "Sandwich + Boisson au choix" },
  { id: "menu_student", name: "Menu Étudiant", price: 13.0, description: "Sandwich + Boisson + Frites (sur présentation de carte)" },
  { id: "sandwich_only", name: "Sandwich Seul", price: 12.0, description: "Le sandwich sans boisson" },
  { id: "menu_kids", name: "Menu Enfant", price: 8.5, description: "Petit Sandwich + Boisson + Surprise" },
];

export const SANDWICH_CATEGORIES: Category[] = [
  {
    id: "meats",
    name: "Les Viandes",
    options: [
      { id: "m1", name: "Merguez Veritables", price: 0, isAvailable: true },
      { id: "m2", name: "Kefta Maison", price: 0, isAvailable: true },
      { id: "m3", name: "Poulet Mariné", price: 0, isAvailable: true },
      { id: "steak", name: "Steak Boucher", price: 0, isAvailable: true },
    ],
  },
  {
    id: "presets",
    name: "Nos Grillades",
    options: [
      { id: "p1", name: "Sandwich Merguez", price: 12, description: "Merguez véritables, frites, salade, tomates, oignons", isAvailable: true },
      { id: "p2", name: "Sandwich Kefta", price: 12, description: "Kefta maison, frites, salade, tomates, oignons", isAvailable: true },
      { id: "p3", name: "Sandwich Poulet", price: 12, description: "Poulet mariné, frites, salade, tomates, oignons", isAvailable: true },
      { id: "p4", name: "Le Mix Grill", price: 15, description: "Mélange de 2 ou 3 viandes au choix, frites, crudités", isAvailable: true },
      { id: "p5", name: "Hamburger", price: 12, description: "Steak boucher, cheddar, frites, crudités", isAvailable: true },
    ],
  },
  {
    id: "steaks_qty",
    name: "Nombre de steaks",
    options: [
      { id: "s1", name: "1 Steak", price: 0, isAvailable: true },
      { id: "s2", name: "2 Steaks", price: 2, isAvailable: true },
      { id: "s3", name: "3 Steaks", price: 4, isAvailable: true },
    ],
  },
  {
    id: "sauces",
    name: "Les Sauces",
    options: [
      { id: "s1", name: "Maison Truffée", price: 0, isAvailable: true },
      { id: "s2", name: "Algérienne", price: 0, isAvailable: true },
      { id: "s3", name: "Blanche Maison", price: 0, isAvailable: true },
      { id: "s4", name: "Samouraï", price: 0, isAvailable: true },
      { id: "s5", name: "Andalouse", price: 0, isAvailable: true },
      { id: "s6", name: "Ketchup", price: 0, isAvailable: true },
      { id: "s7", name: "Mayonnaise", price: 0, isAvailable: true },
      { id: "s8", name: "BBQ", price: 0, isAvailable: true },
    ],
  },
  {
    id: "kids_menu",
    name: "Menu Enfant",
    options: [
      { id: "k1", name: "Junior Burger", price: 8.5, description: "Petit Steak, Ketchup, Fromage, Frites, Jus", isAvailable: true },
      { id: "k2", name: "Nuggets Maison", price: 8.5, description: "6 Nuggets, Frites, Sauce BBQ douce, Jus", isAvailable: true },
      { id: "k3", name: "Mini Pita Poulet", price: 8.5, description: "Poulet émincé, Mayo douce, Frites, Jus", isAvailable: true },
    ],
  },
  {
    id: "extras",
    name: "Suppléments",
    options: [
      { id: "e1", name: "Double Fromage", price: 1.5, isAvailable: true },
      { id: "e2", name: "Oeuf à Cheval", price: 1, isAvailable: true },
      { id: "e3", name: "Bacon de Boeuf", price: 2, isAvailable: true },
      { id: "e4", name: "Oignons Frits", price: 0.5, isAvailable: true },
    ],
  },
  {
    id: "drinks",
    name: "Boissons",
    options: [
      { id: "d1", name: "Coca-Cola (33cl)", price: 2, isAvailable: true },
      { id: "d2", name: "Fanta Orange (33cl)", price: 2, isAvailable: true },
      { id: "d3", name: "Ice Tea Pêche (33cl)", price: 2, isAvailable: true },
      { id: "d4", name: "Eau Minérale (50cl)", price: 1.5, isAvailable: true },
      { id: "d5", name: "Jus d'Orange", price: 2.5, isAvailable: true },
      { id: "d6", name: "Coca-Cola (1.5L)", price: 4.5, isAvailable: true },
      { id: "d7", name: "Sprite (1.5L)", price: 4.5, isAvailable: true },
      { id: "d8", name: "Oasis Tropical (2L)", price: 5, isAvailable: true },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    options: [
      { id: "dess1", name: "Cookie Géant", price: 3, isAvailable: true },
      { id: "dess2", name: "Tiramisu Spéculos", price: 4.5, isAvailable: true },
      { id: "dess3", name: "Brownie Noix", price: 3.5, isAvailable: true },
    ],
  },
  {
    id: "couscous_type",
    name: "Type de Couscous",
    options: [
      { id: "COUSCOUS_T1", name: "Couscous Poulet", price: 0, isAvailable: true, description: "Poulet braisé et légumes frais" },
      { id: "COUSCOUS_T2", name: "Couscous Agneau", price: 3, isAvailable: true, description: "Souris d'agneau fondante" },
      { id: "COUSCOUS_T3", name: "Couscous Bœuf", price: 2, isAvailable: true, description: "Bœuf mijoté aux épices" },
      { id: "COUSCOUS_T4", name: "Couscous Végétarien", price: -2, isAvailable: true, description: "Sept légumes du potager" },
    ],
  },
  {
    id: "couscous_size",
    name: "Nombre de personnes",
    options: [
      { id: "COUSCOUS_S1", name: "Couscous 2 Personnes", price: 28, isAvailable: true },
      { id: "COUSCOUS_S2", name: "Couscous 3 Personnes", price: 39, isAvailable: true },
      { id: "COUSCOUS_S3", name: "Couscous 4 Personnes", price: 48, isAvailable: true },
    ],
  },
];
