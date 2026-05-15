# Design System: Grillade O'Charbon (Premium Food Truck)

## 1. Visual Theme & Atmosphere
Une interface "Gourmet Dark" alliant la rudesse de la grillade au charbon et l'élégance de la haute gastronomie. L'atmosphère est nocturne, luxueuse et ultra-rapide. Utilisation de contrastes élevés entre un fond noir profond et un or vibrant pour diriger l'œil vers l'action de commande.

- **Densité :** Daily App Balanced (6/10) - Informations claires, pas de surcharge.
- **Variance :** Offset Asymmetric (7/10) - Mise en page dynamique, typographie italique.
- **Motion :** Fluid CSS & Spring Physics (7/10) - Transitions douces, retours tactiles au clic.

## 2. Color Palette & Roles
- **Deep Charcoal** (#080808) — Fond principal (Canvas).
- **Pure Surface** (#111111) — Cartes et conteneurs secondaires.
- **Charcoal Ink** (#18181B) — Éléments d'interface tertiaires.
- **Vivid Red** (#EF4444) — Unique accent pour les CTAs, prix et états actifs (Symbole du Feu).
- **Pure White** (#FFFFFF) — Pour les textes importants et contrastes forts.
- **Whisper White** (#F9FAFB) — Texte principal, haute lisibilité.

## 3. Typography Rules
- **Display/Headlines :** `Instrument Serif` (ou Serif systémique stylisé) — Itallique, serré, évoquant l'élégance.
- **Body :** `Satoshi` ou `Geist Sans` — 65ch max, interlignage aéré.
- **Technical/Mono :** `JetBrains Mono` — Pour les prix, identifiants de commande et comptes à rebours.
- **Banned :** Inter (trop générique), Comic Sans, Arial.

## 4. Component Stylings
* **Buttons :** Coins arrondis généreux (1rem). Pas d'ombres portées néon. Translation de -1px au clic pour un effet tactile "mécanique".
* **Cards :** Bordures ultra-fines (#ffffff10). Fond translucide avec flou de derrière (Backdrop Blur).
* **Inputs :** Fond noir, bordure Or uniquement au focus. Labels en majuscules espacées.
* **Loaders :** Squelettes (Skeletons) animés en dégradé Or/Charcoal.

## 5. Layout Principles
- **Grid-First :** Utilisation exclusive de CSS Grid pour les grilles d'options.
- **Asymétrie :** Les titres de sections sont décalés ou stylisés pour éviter le look "template".
- **Mobile First :** Expérience optimisée pour la main droite (boutons d'action en bas).
- **Zero Slop :** Aucun chevauchement d'éléments. Chaque zone est clairement définie.

## 6. Motion & Interaction
- **Spring Physics :** `stiffness: 100, damping: 20` pour les modales et transitions d'étapes.
- **Cascade Reveals :** Les options de sandwich apparaissent avec un léger délai séquentiel (Waterfall).
- **Feedback Immédiat :** Chaque sélection déclenche une micro-vibration visuelle ou un changement d'état fluide.

## 7. Anti-Patterns (Banned)
- Pas d'emojis (utiliser des icônes Lucide minimalistes).
- Pas de noir pur (#000000) pour les surfaces, préférer le Deep Charcoal.
- Pas d'ombres portées colorées (Glow).
- Pas de termes génériques ("Cliquez ici", "Suivant"). Préférer "Continuer la création", "Valider mon mélange".
- Pas de statistiques inventées.
