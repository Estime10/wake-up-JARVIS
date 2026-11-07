# 0006 — (cadre futur) Exécution terminal sécurisée

- **Statut** : Proposé — **revue HACKER obligatoire avant toute ligne de code**
- **Date** : 2026-11-01
- **Relecteurs** : HACKER (obligatoire), THE JUDGE

## Contexte

À partir de V1, E.L.S.A. proposera des commandes à lancer sur un Mac. C'est la partie la plus dangereuse : un LLM peut se tromper ou être manipulé (contenu de mail, page web…). Il faut que **rien** ne s'exécute sans que DevinChat ait vu et signé la **commande exacte**. HACKER a posé deux conditions : **C1 ordres signés** et **C2 confirmation signée**.

## Décision (cadre)

- **Agent macOS en Tauri v2**, lancé comme **LaunchAgent** (session utilisateur, pas root).
- Ordres reçus via une **file Supabase** que l'agent **lit** : **aucun port ouvert** sur le Mac.
- **Catalogue d'actions typé** (schémas Zod côté web, types équivalents côté agent) en **3 niveaux** : 1 lecture, 2 modification, 3 dangereux. Hors catalogue = refusé.
- **C1 — ordres signés de bout en bout** : chaque ordre est signé ; l'agent vérifie la signature avant tout, sinon rejet.
- **C2 — confirmation forte** pour les niveaux 2 et 3 : signature **WebAuthn** (Touch ID ou mot de passe du Mac) portant sur la **commande exacte résolue** (+ dossier, Mac, expiration). La carte n'affiche jamais un résumé du LLM.
- **Jamais de confirmation vocale** pour une action risquée.
- **Journal append-only** (on ajoute, on ne modifie ni ne supprime) ; **arrêt d'urgence** en V2.

## Options envisagées

1. **Agent qui lit une file (pull)** — retenu : pas de port ouvert, l'agent peut être coupé à tout moment.
2. **Serveur local sur le Mac (port ouvert)** — non : surface d'attaque réseau.
3. **Shell libre généré par le LLM** — non : impossible à borner ; catalogue typé obligatoire.
4. **Confirmation par simple clic** pour les niveaux 2/3 — non : ne prouve pas que c'est DevinChat (C2).

## Conséquences

- **Gain** : une action ne peut partir que si DevinChat a signé exactement ce qui s'exécutera ; traçabilité complète.
- **Risque** : gestion des clés de signature, rejeu d'ordres, file compromise. Parades à détailler avec HACKER (nonce, expiration, liaison au Mac).
- **Coût** : agent natif à maintenir, WebAuthn à intégrer ; plusieurs ADR de détail viendront (clés, format d'ordre, catalogue).
