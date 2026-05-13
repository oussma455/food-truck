import { Category } from "@/types";

export const SANDWICH_CATEGORIES: Category[] = [
  {
    id: "bread",
    name: "Choisissez votre pain",
    options: [
      { id: "b1", name: "Baguette Tradition", price: 0 },
      { id: "b2", name: "Pain Pita", price: 0 },
      { id: "b3", name: "Pain Brioché VIP", price: 1.5 },
    ],
  },
  {
    id: "meat",
    name: "Choisissez votre viande",
    options: [
      { id: "m1", name: "Bœuf Effiloché (12h)", price: 5 },
      { id: "m2", name: "Poulet Grillé Mariné", price: 4 },
      { id: "m3", name: "Falafel Maison (Veggie)", price: 3.5 },
      { id: "m4", name: "Steak Boucher Frais", price: 4.5 },
    ],
  },
  {
    id: "sauces",
    name: "Sauces (2 gratuites, puis +0.50€)",
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
    name: "Suppléments gourmands",
    options: [
      { id: "e1", name: "Cheddar Fondu", price: 1 },
      { id: "e2", name: "Oignons Frits", price: 0.5 },
      { id: "e3", name: "Bacon de Bœuf", price: 1.5 },
      { id: "e4", name: "Avocat", price: 2 },
    ],
  },
  {
    id: "drinks",
    name: "Boissons Fraîches",
    options: [
      { id: "d1", name: "Coca-Cola Classic", price: 2.5 },
      { id: "d2", name: "Ice Tea Pêche", price: 2.5 },
      { id: "d3", name: "Eau Minérale (50cl)", price: 1.5 },
      { id: "d4", name: "Limonade Maison", price: 3.5 },
    ],
  },
  {
    id: "desserts",
    name: "Desserts Maison",
    options: [
      { id: "dess1", name: "Cookie Géant Pépite", price: 3 },
      { id: "dess2", name: "Tiramisu Spéculos", price: 4.5 },
      { id: "dess3", name: "Brownie Noix", price: 3.5 },
    ],
  },
];
