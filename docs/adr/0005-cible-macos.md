# 0005 — Cible macOS uniquement

- **Statut** : Proposé
- **Date** : 2026-11-01
- **Relecteurs** : PIXEL, SKETCH, HACKER

## Contexte

DevinChat n'utilise **que des Mac** (Apple Silicon). JARVIS pilotera plus tard ces Mac (agent, réveil de l'écran, Touch ID). Prévoir Windows ou Linux doublerait les tests et les cas de sécurité sans aucun utilisateur.

## Décision

- On cible **macOS uniquement** (navigateurs Safari et Chrome sur Mac, puis l'agent macOS).
- Raccourci micro par défaut : **Ctrl+Maj+Espace**, maintenu pour parler ; **réglable** dans les réglages (« Changer » puis taper la combinaison) ; **toujours avec un modificateur** (WCAG 2.1.4). Le **bouton micro** reste le moyen garanti.
- Libellés et icônes de touches à la façon Mac (⌃ ⇧ ⌥ ⌘).
- Signature des actions risquées : **Touch ID ou mot de passe du Mac** (simulée dans la phase UI, WebAuthn plus tard — voir ADR 0006).

## Options envisagées

1. **macOS uniquement** — retenu : un seul système à tester, intégration propre (Touch ID, `caffeinate`, LaunchAgent).
2. **Multi-OS (Windows Hello, etc.)** — non : aucun besoin, beaucoup plus de cas.
3. **Ctrl+Espace** comme raccourci — non : sur macOS, il change la source de saisie par défaut et n'arrive pas au navigateur.
4. **Une seule touche** (ex. `²`) — non : interdit par WCAG 2.1.4 sans option de désactivation, et risque de déclenchements involontaires.

## Conséquences

- **Gain** : moins de code, moins de tests, sécurité plus simple à raisonner.
- **Risque** : Ctrl+Maj+Espace peut être pris par une autre app sur le Mac de DevinChat → **à tester à l'étape 12** ; d'où le réglage et le bouton micro.
- **Coût** : si un jour un autre OS est voulu, il faudra un nouvel ADR (raccourcis, signature, agent).
