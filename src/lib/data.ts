import { Category, Option } from "@/types";

export const ORDER_TYPES: Option[] = [
  { id: "takeaway", name: "À Emporter", price: 0, description: "Prêt dans un sac biodégradable" },
  { id: "on_site", name: "Sur Place", price: 0, description: "Servi sur un plateau premium" },
];

export const FORMULAS: Option[] = [
  { id: "menu_standard", name: "Menu Complet", price: 14.5, description: "Sandwich + Boisson au choix" },
  { id: "sandwich_only", name: "Sandwich Seul", price: 9.5, description: "Le sandwich sans boisson" },
  { id: "menu_kids", name: "Menu Enfant", price: 8.5, description: "Petit Sandwich + Boisson + Surprise" },
];

export const SANDWICH_CATEGORIES: Category[] = [
  {
    id: "presets",
    name: "Nos Grillades Signature",
    options: [
      { id: "p1", name: "L'Original O'Charbon", price: 10, description: "Viande grillée, Oignons caramélisés, Sauce Maison" },
      { id: "p2", name: "Le Braisé Royal", price: 11, description: "Double viande, Fromage fondant, Bacon grillé" },
      { id: "p3", name: "Le Spicy Grill", price: 10, description: "Viande épicée, Jalapeños, Sauce Poivre" },
      { id: "p4", name: "Le Poulet Fumé", price: 10, description: "Filet de poulet braisé, Crème d'avocat, Salade" },
    ],
  },
  {
    id: "kids_menu",
    name: "Menu Enfant",
    options: [
      { id: "k1", name: "Junior Burger", price: 8.5, description: "Petit Steak, Ketchup, Fromage, Frites, Jus" },
      { id: "k2", name: "Nuggets Maison", price: 8.5, description: "6 Nuggets, Frites, Sauce BBQ douce, Jus" },
      { id: "k3", name: "Mini Pita Poulet", price: 8.5, description: "Poulet émincé, Mayo douce, Frites, Jus" },
    ],
  },
  {
    id: "extras",
    name: "Suppléments",
    options: [
      { id: "e1", name: "Double Fromage", price: 1.5 },
      { id: "e2", name: "Oeuf à Cheval", price: 1 },
      { id: "e3", name: "Bacon de Boeuf", price: 2 },
      { id: "e4", name: "Oignons Frits", price: 0.5 },
    ],
  },
  {
    id: "drinks",
    name: "Boissons",
    options: [
      { id: "d1", name: "Coca-Cola", price: 2 },
      { id: "d2", name: "Fanta Orange", price: 2 },
      { id: "d3", name: "Ice Tea Pêche", price: 2 },
      { id: "d4", name: "Eau Minérale", price: 1.5 },
      { id: "d5", name: "Jus d'Orange", price: 2.5 },
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
