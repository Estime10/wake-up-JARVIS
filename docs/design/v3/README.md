# Maquettes JARVIS — v3 « blanc nacré » (1440×900 + @2x)

> **Dans le dépôt** (`docs/design/v3/`) : seules les captures **@2x** sont gardées (`01-intro-reveil@2x.png`, `01b-intro-reduced-motion@2x.png`, `02-hud-repos@2x.png`, `03-ecoute-parole@2x.png`, `04-confirmation-signature@2x.png`), avec les maquettes front décrites dans [README-front.md](./README-front.md). Les sources HTML, `compare-02-v2-v3.png` et les DA v1/v2 (remplacées) ne sont pas copiés.

Même fond que la v2 (noir cendré, gris) ; même mise en page, texte et alertes. Le cyan glacé est remplacé par un **blanc nacré légèrement chaud**, rendu en dégradés rgba pour faire « vraie lumière ». v1 et v2 ne sont pas modifiées.

| Fichier                     | Écran                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-intro-reveil`           | L'anneau se dessine comme une traînée de lumière (de 0 à 0.95 d'opacité) jusqu'à un point de tête brillant ; ligne de scan en dégradé faible → fort → faible. |
| `01b-intro-reduced-motion`  | Anneau complet et statique (traînée de 0.55 à 0.95), salut complet, « Mouvement réduit : fondu 300 ms ».                                                      |
| `02-hud-repos`              | Au repos : le noyau de l'anneau est une traînée de faible à fort avec un point de tête, « Prêt ».                                                             |
| `03-ecoute-parole`          | Segments radiaux en dégradé (fort à la base, moyen aux pointes) ; barres verticales (moyen → fort au centre → moyen) ; « Réfléchit… » en ambre.               |
| `04-confirmation-signature` | Carte « 3 · Dangereux », attente de signature en ambre, focus blanc plein sur Annuler.                                                                        |
| `compare-02-v2-v3.png`      | v2 (gauche) et v3 (droite) de l'écran 02. _(non copié dans le dépôt)_                                                                                         |

## Tokens finaux

| Token                                                      | Valeur                                             | Rôle                                                                                          |
| ---------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--color-bg`                                               | #0B0B0C                                            | fond                                                                                          |
| `--color-surface`                                          | #141416                                            | verre 85 % + blur 8 px (composé : #131315)                                                    |
| `--color-surface-2`                                        | #1C1C1F                                            | cartes                                                                                        |
| `--color-text`                                             | #E8E8E6                                            | texte                                                                                         |
| `--color-text-muted`                                       | #9A9A97                                            | texte secondaire                                                                              |
| `--color-line`                                             | #6A6A6E                                            | bordures de contrôles                                                                         |
| `--color-line-subtle`                                      | #2A2A2D                                            | décor uniquement                                                                              |
| `--color-hud` / `--color-hud-strong`                       | #3A3A3E / #55555A                                  | arcs, graduations, crochets (décor)                                                           |
| `--color-accent`                                           | **#ECEAE4**                                        | blanc nacré **plein** : anneau de focus (2 px, décalage 2 px), petites icônes d'état, curseur |
| `--accent-light-strong`                                    | rgba(236,234,228,0.95)                             | tête des traînées, centre des barres, centre du soulignement d'onglet                         |
| `--accent-light-mid`                                       | rgba(236,234,228,0.55)                             | pointes des segments et des barres, début de la traînée en mouvement réduit                   |
| `--accent-light-faint`                                     | rgba(236,234,228,0.12)                             | queue des traînées, extrémités de la ligne de scan et du soulignement d'onglet                |
| `--btn-light-top` → `--btn-light-bottom`                   | #F1EFEA → #CFCCC5                                  | `--btn-light`, dégradé vertical : Envoyer, micro actif, interrupteur activé                   |
| `--color-on-accent`                                        | #0B0B0C                                            | icônes et texte sur bouton clair                                                              |
| `--color-attention` / `--color-danger` / `--color-success` | #F5B84A / #FF6B6B / #5EE3A1                        | inchangés                                                                                     |
| `--glow` / `--glow-strong`                                 | 6 px à 0.18 / 14 px à 0.22, blanc rgb(236 234 228) | statiques, traits décoratifs uniquement                                                       |
| `--glow-amber`                                             | 8 px à 0.30                                        | inchangé depuis la v2                                                                         |

Traînée de l'anneau : un seul tracé SVG découpé en 120 à 240 arcs, dont l'opacité monte de `faint` à `strong` (courbe t^1.6), puis un point de tête plein. C'est la solution statique pour SVG, qui n'a pas de dégradé conique.
**Distinguer l'accent du texte** : #ECEAE4 et #E8E8E6 ont la même clarté (1.02:1). L'accent ne porte donc jamais d'information de texte. Il se reconnaît à la forme (traînée, point de tête, barres), au halo statique (le texte n'en a jamais), à la graisse 600 et au soulignement en dégradé de l'onglet actif. Chaque état garde son libellé et son icône.

## Contrastes WCAG

| Premier plan                                         | Fond                                                  | Ratio                                                                                         | Exigence         |
| ---------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------- |
| text #E8E8E6                                         | bg / verre / surface-2                                | 16.04 / 15.12 / 13.86:1                                                                       | 4.5 ✅           |
| text                                                 | tint-attention #2F281C                                | 11.88:1                                                                                       | 4.5 ✅           |
| text-muted #9A9A97                                   | bg / verre / surface-2                                | 6.97 / 6.58 / 6.03:1                                                                          | 4.5 ✅           |
| accent #ECEAE4 (icônes, « Transcription en cours… ») | bg / verre / surface-2                                | 16.35 / 15.43 / 14.13:1                                                                       | 4.5 ✅           |
| on-accent #0B0B0C sur bouton clair                   | haut #F1EFEA / **bas #CFCCC5 (arrêt le plus sombre)** | 17.12 / **12.27:1**                                                                           | 4.5 ✅           |
| attention #F5B84A                                    | bg / verre / surface-2                                | 11.09 / 10.46 / 9.58:1                                                                        | 4.5 ✅           |
| danger #FF6B6B                                       | verre / surface-2                                     | 6.69 / 6.13:1                                                                                 | 4.5 ✅           |
| danger (badge)                                       | tint-danger #3C272A                                   | **4.99:1** (minimum texte)                                                                    | 4.5 ✅           |
| success #5EE3A1                                      | verre / surface-2                                     | 11.47 / 10.51:1                                                                               | 4.5 ✅           |
| focus #ECEAE4, plein                                 | bg / verre / surface-2                                | 16.35 / 15.43 / 14.13:1                                                                       | 3 ✅             |
| line #6A6A6E (bordures)                              | bg / verre / surface-2                                | 3.65 / 3.45 / **3.16:1** (minimum contrôle)                                                   | 3 ✅             |
| bouton clair (bord #CFCCC5)                          | bg / verre                                            | 12.27 / 11.57:1                                                                               | 3 ✅             |
| soulignement d'onglet, centre `strong`               | verre                                                 | 13.93:1 (extrémités `faint` décoratives ; l'onglet actif est aussi en graisse 600 avec icône) | 3 ✅             |
| `mid` sur bg / verre                                 | —                                                     | 5.40 / 5.31:1                                                                                 | (décor)          |
| `faint`, hud, hud-strong, line-subtle                | bg                                                    | 1.30 / 1.74 / 2.65 / 1.37:1                                                                   | décor uniquement |
