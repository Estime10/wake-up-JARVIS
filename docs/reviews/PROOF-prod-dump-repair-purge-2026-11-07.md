# Preuves §5–7 — dump / repair / purge (2026-11-07)

Projet : `jarvis` (`kqoqtilwakdwkbphxdrf`).  
SHA code : `717d5a3` (indépendant de ces écritures prod).

## §5 Dump (hors site)

| Fichier                                                                  |            Taille | Heure (UTC)          |
| ------------------------------------------------------------------------ | ----------------: | -------------------- |
| `~/Desktop/elsa-backups/jarvis-kqoqtilwakdwkbphxdrf-20261107-193343.sql` | 58 619 o (schéma) | 2026-11-07T18:33:51Z |
| `~/Desktop/elsa-backups/jarvis-data-20261107-193511.sql`                 |   84 283 o (data) | ~18:35Z              |

## §6 Migrations alignées

- 13 versions MCP « orphelines » → `reverted`
- 21 versions repo → `applied`
- Preuve : `supabase migration list --linked` → Local = Remote pour les 21 fichiers

## §7 Purge H2 messages

- Avant : assistant **53** · user **54**
- Après : assistant **0** · user **54**
- SQL : `DELETE FROM public.messages WHERE role = 'assistant'`
