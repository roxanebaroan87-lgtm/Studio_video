# By Lau — identité visuelle

- `brand.js` : monogramme BL calligraphique (tracé à la plume), sceau ovale, logotype, fond satin.
- `brand.html?doc=…` : chaque support d'impression (taille réelle en mm, fond perdu de 3 mm inclus).
- `export-brand.cjs` : exporte tous les supports en PDF (pour l'imprimeur) et PNG (~300 dpi) dans `impression/`.
- `board.html` : planche de présentation (maquettes sachets, cartes, affiche).

Textes à personnaliser (numéro, compte, ville) : constantes `PH`, `IG`, `CITY` en haut de `brand.html`.

| Fichier | Format |
|---|---|
| affiche-A3 | A3 297×420 mm (+3 mm) |
| carte-visite-recto / verso | 85×55 mm (+3 mm) |
| carte-merci-recto / verso | A6 148×105 mm (+3 mm) |
| etiquette-ronde | Ø 50 mm (+2 mm) |
| etiquette-merci | 60×40 mm (+2 mm) |
| papier-de-soie | A4, motif répétable |
| sceau, sceau-fond-bordeaux, sceau-encre-blanche, monogramme | logos seuls (marquage sachets, tampon, broderie) |

## Packaging (emblème bL)
- `kit.html?doc=…` + `export-kit.cjs` → `packaging/` (PDF + PNG) : emblème, sceau rond, arche, sticker, papier cadeau (2 coloris, 42×59,4 cm), ruban (25 mm), étiquette cadeau, cartes merci, mini-carte.
- `board-packaging.html` : planche de présentation packaging.
