import { Category } from "@/types";

export const SANDWICH_CATEGORIES: Category[] = [
  {
    id: "bread",
    name: "Choisissez votre pain",
    options: [
      { id: "b1", name: "Baguette Tradition", price: 0, image: "https://images.unsplash.com/photo-1597079910443-60c43fc4f729?q=80&w=400&auto=format&fit=crop" },
      { id: "b2", name: "Pain Brioché", price: 1.5, image: "https://images.unsplash.com/photo-1601054704854-1a2e79dac4d3?q=80&w=400&auto=format&fit=crop" },
      { id: "b3", name: "Pain Complet", price: 0.5, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop" },
    ],
  },
  {
    id: "meat",
    name: "Choisissez votre viande",
    options: [
      { id: "m1", name: "Bœuf Effiloché (12h)", price: 5, image: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop" },
      { id: "m2", name: "Poulet Mariné", price: 4, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=400&auto=format&fit=crop" },
      { id: "m3", name: "Falafel Maison", price: 3.5, image: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?q=80&w=400&auto=format&fit=crop" },
      { id: "m4", name: "Steak Boucher", price: 4.5, image: "https://images.unsplash.com/photo-1546241072-48010ad2862c?q=80&w=400&auto=format&fit=crop" },
    ],
  },
  {
    id: "sauces",
    name: "Choisissez vos sauces (max 2)",
    options: [
      { id: "s1", name: "Maison Truffée", price: 0.5, image: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=400&auto=format&fit=crop" },
      { id: "s2", name: "Algérienne", price: 0, image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?q=80&w=400&auto=format&fit=crop" },
      { id: "s3", name: "Mayo-Ail", price: 0, image: "https://images.unsplash.com/photo-1512485600893-b08ec1d59b1d?q=80&w=400&auto=format&fit=crop" },
      { id: "s4", name: "BBQ Fumée", price: 0, image: "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?q=80&w=400&auto=format&fit=crop" },
    ],
  },
  {
    id: "extras",
    name: "Suppléments gourmands",
    options: [
      { id: "e1", name: "Cheddar Fondu", price: 1, image: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?q=80&w=400&auto=format&fit=crop" },
      { id: "e2", name: "Oignons Frits", price: 0.5, image: "https://images.unsplash.com/photo-1581447100595-37730ca2444d?q=80&w=400&auto=format&fit=crop" },
      { id: "e3", name: "Bacon de Bœuf", price: 1.5, image: "https://images.unsplash.com/photo-1606851682841-949519cca31e?q=80&w=400&auto=format&fit=crop" },
      { id: "e4", name: "Avocat", price: 2, image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=400&auto=format&fit=crop" },
    ],
  },
  {
    id: "drinks",
    name: "Boissons Fraîches",
    options: [
      { id: "d1", name: "Coca-Cola Classic", price: 2.5, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop" },
      { id: "d2", name: "Ice Tea Pêche", price: 2.5, image: "https://images.unsplash.com/photo-1499638930204-05822383145d?q=80&w=400&auto=format&fit=crop" },
      { id: "d3", name: "Eau Minérale (50cl)", price: 1.5, image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?q=80&w=400&auto=format&fit=crop" },
      { id: "d4", name: "Limonade Maison", price: 3.5, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400&auto=format&fit=crop" },
    ],
  },
  {
    id: "desserts",
    name: "Desserts Maison",
    options: [
      { id: "dess1", name: "Cookie Géant Pépite", price: 3, image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=400&auto=format&fit=crop" },
      { id: "dess2", name: "Tiramisu Spéculos", price: 4.5, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=400&auto=format&fit=crop" },
      { id: "dess3", name: "Brownie Noix", price: 3.5, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400&auto=format&fit=crop" },
    ],
  },
];
