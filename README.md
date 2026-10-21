# EZAZOZO — Haute Braise & Lounge Gastronomique
> **Site Web Cinématique & Vol Immersif FPV**  
> Lomé, Togo — Quartier Agoé Assiyéyé, près de la station Total Minamadou.

---

## 1. Présentation du Projet

Ce projet est la vitrine web cinématique haut de gamme du restaurant **EZAZOZO**, spécialisé dans le poisson braisé gourmet au feu de bois de mangrove et l'expérience lounge nocturne.

Le cœur de l'expérience est un **vol immersif continu en vue subjective (FPV)** asservi au défilement (scroll-driven), sans coupure, qui transporte le visiteur depuis la rue nocturne pavée jusqu'au seuil du salon lounge, en passant devant les braises ardentes et les tablées de la terrasse couverte.

Le site est entièrement rédigé en **français (Togo)**, avec des tarifs libellés en **FCFA** (ou *"prix à confirmer"*), et intègre des modules directs de commande et de réservation synchronisés via **WhatsApp**.

---

## 2. Démarrage Rapide

### Prérequis
- Node.js (v18 ou supérieure)
- npm

### Lancer la version de production (Recommandé pour tester les performances)
Le serveur de prévisualisation de production est déjà compilé et optimisé :
```bash
npm run preview -- --host
```
- **Accès Local (sur ce PC) :** [http://localhost:4173/](http://localhost:4173/)
- **Accès Réseau (depuis votre smartphone sur le même Wi-Fi) :** `http://192.168.88.47:4173/` *(remplacez par l'IP de votre machine si elle change)*

### Mode Développement
Pour effectuer des modifications en direct avec rechargement instantané (HMR) :
```bash
npm run dev -- --host
```

### Compiler pour la production
```bash
npm run build
```
Le bundle final est généré dans le dossier `dist/`.

---

## 3. Architecture & Fonctionnalités Clés

### A. Le Vol Immersif FPV (`src/components/FlyThroughCanvas.tsx`)
- **Clip A réel (8,05 secondes)** : Généré via Higgsfield Seedance 2.0 (image-to-video 720p).
- **Découpage en 161 images WebP** à 20 images/seconde :
  - **Desktop (1280×720px, qualité 75)** : ~7,08 Mo au total, mis en mémoire tampon progressive.
  - **Mobile (480×720px, recadrage portrait centré, qualité 70)** : ~2,99 Mo au total.
- **Affichage instantané (Zéro écran noir) :**
  - Un élément `<picture>` avec les affiches WebP ultra-légères (`poster-desktop.webp` de 46,8 Ko et `poster-mobile.webp` de 44,3 Ko) s'affiche immédiatement sous le canvas dès 0 ms.
  - L'image 1 est peinte sur le `<canvas>` dès son chargement en mémoire, sans attendre le moindre défilement.
  - Algorithme de repli sur l'image chargée la plus proche en cas de défilement rapide.
  - Boucle d'animation fluide `requestAnimationFrame` avec interpolation douce.
  - Piste de défilement virtuelle de 280svh garantissant un scrubbing naturel et progressif.

### B. Parcours Scénographique & Titres Flottants
Pendant le vol de 0 à 100% de défilement, 4 temps forts typographiques rythment l'exploration :
1. **0% - 25%** : *L'Entrée Secrète* — Agoé Assiyéyé, l'appel de la braise.
2. **25% - 50%** : *L'Âtre Ardent* — Braise de mangrove, sel de mer & piments locaux.
3. **50% - 75%** : *La Terrasse Vivante* — Tablées conviviales et brise côtière.
4. **75% - 100%** : *Le Seuil du Lounge* — Vers l'intimité du salon nocturne.

### C. La Carte Gastronomique & Le Panier Mobile (`src/components/MenuSection.tsx`, `OrderModule.tsx`)
- Sélection de poissons entiers (Bar de ligne, Vivaneau rouge, Capitaine, Carpe) avec garnitures authentiques (Alloco, Attiéké, Frites de manioc).
- Cartes illustrées par de véritables photographies de référence WebP légères (< 80 Ko) ou compositions visuelles typographiques d'art culinaire (zéro image cassée).
- Système de panier interactif : bouton **"+ Ajouter"** sur chaque plat, récapitulatif avec total et génération d'un message pré-rempli pour envoi en 1 clic sur WhatsApp.
- Bouton flottant WhatsApp persistant (`WhatsAppFAB.tsx`) adapté aux zones d'écran sécurisées mobiles (`safe-area-inset-bottom`).

### D. Le Salon, Bar & Informations Pratiques
- **Bar & Cocktails (`BarSection.tsx`)** : Bières togolaises (Awooyo, Beaufort, Castel), vins et cocktails signature.
- **Informations & Carte (`InfosSection.tsx`)** : Arrière-plan cinématique nocturne `reveal-still.webp` avec grain argentique, horaires (ouvert jusqu'à 00h00) et repère d'accès près de Total Minamadou.

---

## 4. Guide d'Édition du Contenu

Toutes les données du site (textes, prix, coordonnées, poissons, boissons) sont éditables dans un seul fichier sans toucher au code :
- **Fichier de contenu :** [`src/data/content.ts`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/src/data/content.ts)
- **Documentation détaillée :** [`src/data/README-EDITION.md`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/src/data/README-EDITION.md)

### Pour modifier les prix ou ajouter un plat :
Ouvrez [`src/data/content.ts`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/src/data/content.ts), localisez l'objet `menu` et remplacez `"prix à confirmer"` par le montant en FCFA (ex: `"5 000 FCFA"`).

---

## 5. Ce Qui Est Final vs Ce Qui Reste Provisoire

| Élément | Statut Actuel | Note / Évolution Future |
| :--- | :--- | :--- |
| **Clip A (Vol d'entrée)** | **Définitif & Intégré** | 8 secondes réelles issues de Higgsfield Seedance 2.0 (161 frames WebP desktop/mobile). |
| **Clip B (Intérieur Lounge / Révélation aérienne)** | **En réserve** | Non généré conformément à la consigne budgétaire (solde Higgsfield de 1,99 USD intact). Le site termine élégamment le Clip A au seuil du lounge et enchaîne directement sur la découverte du lieu et de la carte. |
| **Prix du Menu** | **À confirmer** | Mention `"prix à confirmer"` standardisée conformément aux consignes. |
| **Numéro WhatsApp** | **Opérationnel** | Configuré sur `+228 90 00 39 21` avec messages d'accueil et de commande personnalisés. |
| **Performances & Écrans Noirs** | **Corrigé & Validé** | 0 erreur console, 0 overflow horizontal, affiche immédiate en < 50 Ko. |

---

## 6. Vérifications & Mesures Techniques

Audit automatisé réalisé sous navigateur sans tête (Chromium) aux résolutions 390px (mobile) et 1280px (desktop) à 0%, 25%, 50%, 75% et 100% de défilement :
- **Débordement horizontal :** `false` (aucun scroll parasite horizontal).
- **Erreurs console / requêtes échouées :** `0` (aucun asset 404).
- **Poids au chargement initial (Mobile) :** ~264 Ko (HTML, CSS, JS minifié, police, affiche WebP).
- **Poids total séquence d'images mobile (161 frames) :** 2,98 Mo (téléchargement progressif en arrière-plan).
- **Captures d'écran de validation :** Disponibles dans le dossier [`verification/screenshots/`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/verification/screenshots/).
