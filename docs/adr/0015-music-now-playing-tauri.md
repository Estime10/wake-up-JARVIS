# 0015 — Now Playing : probe/transport locaux via Tauri

- **Statut** : Proposé
- **Niveau** : 2 (shell packagé vs API Next, IPC musique)
- **Date** : 2026-11-16
- **Relecteurs** : HACKER, ARCHITECT, THE JUDGE

## Contexte

Le `.app` charge l’UI depuis `frontendDist` Vercel (`tauri.conf.json`). Un probe `pmset`/`osascript` dans une Route Handler Next s’exécute sur Linux → snapshot idle permanent. Les touches média vivent déjà en Rust ; l’état UI restait coupé du Mac hôte.

## Décision

- **Shell Tauri** : `music_now_playing` + `music_transport` en Rust (local), exposés via `MusicPort` / adapter Tauri.
- **Web / hors shell** : API Next ` /api/music/*` reste le fallback (darwin uniquement).
- **Source de vérité play/pause Deezer** : menu Lecture (pas seulement `pmset`).
- **Transport** : `spawn_blocking` + timeout sous-processus ; `accepted` après vérification d’état.
- **Pas** de dépendance au serveur Vercel pour l’état média du shell packagé.

## Options envisagées

1. **Probe + transport Rust (retenu)** — cohérent avec ADR 0014 (voix invoke locale).
2. **Garder l’API Next partout** — écarté : casse le `.app` packagé.
3. **Bundler un Next local dans le `.app`** — reporté (coût packaging).

## Conséquences

- **Gain** : UI Now Playing correcte hors `tauri:dev` ; une porte `MusicPort` testable.
- **Risque** : duplication partielle des scripts AppleScript TS (fallback) ↔ Rust — à réduire ensuite.
- **Coût** : permissions `allow-music-now-playing` / `allow-music-transport` ; Automation macOS requise.
- **Capabilities** : `default` = localhost (IPC complet) ; `remote-prod` = Vercel sans PTY/Studio ensure — réduit la surface XSS→RCE locale.
