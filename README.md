# Studio Montage

Générateur de montages verticaux (1080×1920, 30 i/s) au style « tuto » : fond quadrillé crème, cercle rose,
barre d'étapes, mockups animés (chat, mémo vocal, storyboard, cartes), sous-titres bordeaux avec mot en gras,
bulle d'icône, sticker, et un appel à l'action « commente MOT » à la fin. Bruitages (pop / whoosh) générés automatiquement.

Chaque vidéo est décrite par un simple fichier JSON dans `scripts/`.

## Prérequis
- Node.js 18+, ffmpeg
- Playwright : `npm install playwright && npx playwright install chromium`

## Utilisation
```bash
# Prévisualiser dans le navigateur (lecture, barre de défilement, espace = pause)
node tools/server.mjs scripts/exemple.json
# → ouvrir l'URL affichée

# Exporter en MP4
node tools/render.mjs scripts/exemple.json out/exemple.mp4
# options : --workers 4  --from 10 --to 20 (rendre seulement un extrait)
```

## Créer un nouveau montage
Copie `scripts/exemple.json` et modifie-le.

### Réglages généraux
| Clé | Rôle |
|---|---|
| `brand.name`, `brand.handle` | Pastille en haut (nom + @compte) |
| `sticker` | `grape`, `heart`, `cherry`, `star` ou un emoji (ex. `"🍓"`) |
| `avatar` | Chemin d'un PNG détouré (toi), affiché en bas à gauche. `null` = mise en page centrée |
| `theme` | Couleurs : `accent`, `dark`, `circle`, `background`, `text` |
| `audio.voix` | Ta voix off (mp3/wav/m4a), chemin relatif au JSON |
| `audio.musique`, `audio.volumeMusique` | Musique de fond (bouclée, fondu de sortie) |
| `audio.bruitages` | `true`/`false` : pops sur chaque sous-titre, whoosh à chaque scène |
| `totalSteps` | Nombre d'étapes dans la barre de progression |

### Scènes (`scenes`)
Toutes acceptent `duration` (s), `step` (numéro d'étape, absent = barre cachée), `icon` et `captions`.

| `type` | Contenu | Clés propres |
|---|---|---|
| `hook` | Titre + téléphone + badge vues | `title`, `accent`, `accentAt`, `views`, `image` |
| `chat` | Fenêtre de chat, prompt tapé, résultat généré | `greeting`, `label`, `prompt`, `typeAt`, `cps`, `result` |
| `voice` | Téléphone « Mémo vocal » avec chrono et onde | `label`, `recAt` |
| `storyboard` | Script à gauche, aperçu qui se construit à droite | `label`, `text`, `hillsAt`, `textAt` |
| `cards` | Titre + 2 cartes + bandeau | `title`, `cards[]` (`kicker`, `title`, `dark`), `badge`, `badgeAt` |
| `cta` | « commente MOT » | `top`, `word`, `pill`, `pillAt` |

`result` (scène chat) : `{ "kind": "landscape" | "product" | "image", "at": 3, "text": "...", "textAt": 5, "src": "img.png", "palette": {...} }`

### Sous-titres
- `"captions": ["ton **style**", "par exemple"]` → répartis automatiquement sur la scène
- ou `[{ "text": "ton **style**", "at": 0.9, "icon": "palette" }]` → `at` en secondes depuis le début de la scène

Mise en forme : `**gras**` (mot mis en avant), `*italique*` (serif rose, pour les titres), `\n` retour à la ligne.

Icônes : `palette`, `mic`, `eye`, `sparkle`, `download`, `box`, `heart`, `plus`, `chat`, `scissors`, `film`, `star`.

### Caler sur ta voix off
Enregistre ta voix, écoute-la et note quand chaque phrase commence : règle `duration` de chaque scène
et `at` de chaque sous-titre en conséquence, puis vérifie en prévisualisation (la voix est jouée en même temps).

## Publicité produit (ex. gommage au café)
Exemple complet : `scripts/pub-gommage-cafe.json`. Scènes supplémentaires :

| `type` | Contenu | Clés propres |
|---|---|---|
| `portrait` | Femme illustrée qui tient le pot, pastilles d'arguments | `title`, `badges[]`, `badgeAt`, `badgeGap`, `beans` |
| `product` | Le pot arrive avec une explosion de grains de café | `title`, `subtitle` |
| `ingredients` | 3 cartes ingrédients | `title`, `items[]` (`emoji`, `name`, `desc`) |
| `routine` | 3 étapes d'utilisation | `title`, `steps[]` (`icon`, `name`, `desc`) |

Réglages : `product` (nom, sous-titre et couleurs du pot), `woman` (peau, cheveux, haut, lèvres).

## Voix off automatique
La voix est générée par synthèse vocale (Piper, voix féminine française « siwis »), puis les durées des scènes
et les sous-titres sont calés dessus automatiquement.

```bash
pip install piper-tts                     # (dans un venv de préférence)
mkdir -p voices && curl -L https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-siwis-medium.tar.gz | tar xz -C voices
python3 tools/voix.py scripts/pub-gommage-cafe.json --vitesse 0.92 --pause 0.3
node tools/render.mjs scripts/build/pub-gommage-cafe.json out/pub-gommage-cafe.mp4
```

Dans le JSON, chaque scène a une liste `voix` : `{ "texte": "phrase prononcée", "sous_titres": ["morceau **1**", "morceau 2"] }`.
