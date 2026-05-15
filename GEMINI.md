# Projet La Grillade O'Charbon - Instructions de Développement

## 🛡️ Architecture & Cloisonnement
- **Isolation Totale :** Les logiques de "Grillades" (Sandwichs) et de "Couscous" sont strictement séparées. 
- **Identifiants Couscous :** Tous les IDs de formules et d'options pour le couscous doivent impérativement commencer par le préfixe `COUSCOUS_` (ex: `COUSCOUS_S1`, `COUSCOUS_MEAT`).
- **Moteurs de Calcul :** Utiliser les fonctions dédiées `calculateGrilladeTotal` et `calculateCouscousTotal` pour éviter toute régression.

## 💰 Règles de Prix & Quotas
- **Acompte Obligatoire :** 
  - 30% pour les commandes classiques (Sandwichs).
  - 50% pour les précommandes Couscous (24h à l'avance).
- **Boissons Offertes (Menus uniquement) :**
  - **Sandwich Seul :** AUCUNE boisson offerte (quota = 0).
  - **Menus Grillades :** 1 cannette (33cl/50cl) offerte. Les bouteilles 1.5L/2L sont toujours payantes.
  - **Couscous :** Quotas de 2, 3 ou 4 canettes selon la taille. 
  - **Exception Couscous 4 pers :** Le client peut choisir 1 bouteille 1.5L offerte à la place des 4 canettes.
- **Sauces :** 2 premières gratuites, puis +0.50€ par sauce supplémentaire.

## 🎨 Interface & UX (Version 1.9+)
- **Contraste Solaire :** Fond noir pur (#000000), textes et boutons importants en blanc pur (#FFFFFF).
- **Footer Compact :** La barre de navigation doit rester minimaliste avec le "Total à payer" au centre.
- **Branding :** Signature "Propulsé par Search-Digital" cliquable vers `https://www.search-digital.fr/`.
- **Visibilité :** Masquer les prix de base (10€) dans les menus, n'afficher que les suppléments (ex: +1.00€).

## 🚀 Prochaines Étapes
- Intégrer les clés API SumUp réelles dans le tunnel de paiement (actuellement en mode simulation).
- Connecter OneSignal pour les notifications push de statut de commande.
