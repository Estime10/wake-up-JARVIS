# Crédits — voix E.L.S.A. / JARVIS

Projet personnel **DevinChat**, non commercial.  
Page app : [`/credits`](https://wake-up-jarvis.vercel.app/credits) · notice courte : [`NOTICE`](./NOTICE)

## Piper TTS

- Projet : [OHF-Voice / Piper](https://github.com/OHF-Voice/piper1-gpl) (héritage rhasspy/piper)
- Licence code : **GPL-3.0-or-later**
- Phonétisation : **eSpeak NG** (GPL)
- Usage shell : HTTP loopback `127.0.0.1:5911` (Waitress) — jamais exposé sur le LAN

## Voix `fr_FR-siwis-medium`

| Champ        | Valeur                                                             |
| ------------ | ------------------------------------------------------------------ |
| Dataset      | **siwis** (`fr_FR-siwis-medium.onnx.json`)                         |
| Fichier      | `models/piper/fr_FR-siwis-medium.onnx`                             |
| SHA-256 pin  | `641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99` |
| Licence type | **CC BY 4.0** (vérifier le `MODEL_CARD` du paquet voix si présent) |

**Point ouvert :** dérivation éventuelle d’une voix lessac parfois marquée « research only ».  
**Usage personnel E.L.S.A. : OK.** Avant vente ou distribution publique : revalider la chaîne de licences (SIWIS / lessac / Piper GPL) avec conseil.

## Runtime & shell

- **Next.js** UI · **Tauri v2** shell macOS (`be.devinchat.elsa`)
- **Waitress** (WSGI) devant Piper en prod shell — distinct du serveur Flask de DX

## Remerciements

Merci aux mainteneurs Piper, eSpeak NG, et aux contributeurs des voix ouvertes FR (SIWIS).

## Mentions marques

**JARVIS** et **Iron Man** sont des marques / personnages Marvel (The Walt Disney Company).  
Ce dépôt n’a **aucun** lien avec Marvel ni Disney.
