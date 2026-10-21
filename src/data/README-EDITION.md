# EZAZOZO — Guide d'Édition du Contenu & Production

Ce guide résume la structure du site web d'**EZAZOZO** (*Haute Braise & Lounge Gastronomique*, Lomé, Togo) et explique comment modifier facilement les textes, menus, tarifs et coordonnées sans toucher au code des composants.

---

## 1. Fichier Unique de Contenu : `src/data/content.ts`

Tous les textes affichés sur le site sont centralisés dans [`src/data/content.ts`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/src/data/content.ts).

### Coordonnées & Horaires
Dans l'objet `restaurant` :
- `phone` : Numéro d'appel et WhatsApp (ex: `+228 90 00 39 21`)
- `whatsappUrl` : Lien direct (ex: `https://wa.me/22890003921`)
- `hours` : Horaires de service (`Ouvert tous les jours jusqu’à 00h00`)
- `addressDisplay` : Repère géographique (`Agoé Assiyéyé, près de la station Total Minamadou, Lomé — Togo`)

### La Carte & Les Prix (en FCFA)
Dans l'objet `menu` :
- `fish` : Poissons entiers braisés (Bar de ligne, Vivaneau rouge, Capitaine, Carpe)
- `sides` : Accompagnements (Alloco, Frites de manioc, Frites de pommes de terre, Attiéké)
- `drinks` : Vins, Bières togolaises (Awooyo, Beaufort, Castel), Cocktails
- `desserts` : Douceurs maison

> **Note sur les Prix :**  
> Tous les prix sont actuellement enregistrés avec la mention `"prix à confirmer"`. Lorsque les prix fixes au kilo ou à la portion sont définis, remplacez simplement cette chaîne par le montant exact (ex: `"4 500 FCFA"`).

---

## 2. Le Vol Immersif FPV (Fly-Through Canvas)

Le centrepiece du site est orchestré par le composant [`src/components/FlyThroughCanvas.tsx`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/src/components/FlyThroughCanvas.tsx).

- **Séquences d'images WebP (Clip A réel — 161 images à 20 fps) :**
  - Bureau (Desktop) : [`public/frames/clip-a/desktop/f-XXXX.webp`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/public/frames/clip-a/desktop) (1280×720px, qualité 75, ~7.08 Mo au total)
  - Mobile : [`public/frames/clip-a/mobile/f-XXXX.webp`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/public/frames/clip-a/mobile) (480×720px portrait centré, qualité 70, ~2.99 Mo au total)
- **Affiches d'affichage instantané (Posters < 50 Ko) :**
  - [`public/images/poster-desktop.webp`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/public/images/poster-desktop.webp) (960×540px, 46.8 Ko)
  - [`public/images/poster-mobile.webp`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/public/images/poster-mobile.webp) (480×720px, 44.3 Ko)
- **Manifeste technique :** [`public/frames/manifest.json`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/public/frames/manifest.json)
- **Vidéo source de référence :** [`media/source/clip-a.mp4`](file:///c:/Users/LENOVO/Documents/Eza%20zozo/media/source/clip-a.mp4) (8,05 secondes, 720p, 20 fps)

---

## 3. Lancer et Compiler le Projet

- **Mode Développement :** `npm run dev` (disponible sur `http://localhost:5173/`)
- **Compilation Production :** `npm run build` (génère le dossier `dist/` prêt pour déploiement)
- **Re-génération de la séquence d'images :** `npx tsx scripts/build-flight-sequence.ts`
