# 0007 — (cadre futur) Mot de réveil « Wake up, JARVIS »

- **Statut** : Proposé
- **Date** : 2026-11-01
- **Révisé** : 2026-11-07 (produit = E.L.S.A. ; phrase de réveil inchangée jusqu’à nouvel ADR)
- **Relecteurs** : HACKER (obligatoire), PIXEL

## Contexte

En V3, DevinChat veut dire « Wake up, JARVIS » pour réveiller son Mac (phrase historique ; le produit UI s’appelle **E.L.S.A.**). L'écoute doit rester **locale** (vie privée), gratuite pour un projet perso, et ne doit **jamais** permettre d'ouvrir le Mac à la voix (une voix s'enregistre ou s'imite). L'UI prévoit déjà un indicateur permanent « Réveil actif » avec un bouton pour le couper.

## Décision (cadre)

- Détection du mot de réveil avec **openWakeWord**, en **local dans l'agent macOS** (aucun son envoyé sur le réseau).
- Le mot de réveil **réveille seulement l'écran** (`caffeinate -u`) et passe l'UI en état « Écoute… ».
- **Déverrouillage par mot de passe ou Touch ID uniquement, jamais par la voix.**
- Indicateur « Réveil actif » toujours visible (texte + icône) et coupable en un clic.

## Options envisagées

1. **openWakeWord local** — retenu : open source, sans clé ni compte, tourne hors ligne.
2. **Porcupine (Picovoice)** — non : plus d'offre gratuite depuis le **30/06/2026** (les clés gratuites ne sont plus validées et le SDK ne démarre pas sans clé valide).
3. **Reconnaissance dans le navigateur** — non : onglet ouvert obligatoire, micro du navigateur toujours actif.
4. **Déverrouillage vocal** — refusé : risque de sécurité inacceptable.

## Conséquences

- **Gain** : mains libres, vie privée respectée, aucun coût de licence.
- **Risque** : faux déclenchements (au pire l'écran s'allume, rien ne s'exécute) ; précision du modèle pour cette phrase, à mesurer ; micro actif en permanence → indicateur visible et bouton couper obligatoires.
- **Coût** : modèle à entraîner ou adapter pour « Wake up, JARVIS » ; intégration dans l'agent (ADR 0006) ; tests sur le Mac de DevinChat.
