/**
 * Mails factices — lecture seule.
 * Consommés via MailPort (adapters/mock), pas directement par l'UI.
 */

import { z } from "zod";

import { mailSummarySchema, type MailSummary } from "@/lib/schemas";

export type { MailSummary as MockMail };

export const MOCK_MAILS: readonly MailSummary[] = z
  .array(mailSummarySchema)
  .parse([
    {
      id: "mail_01",
      from: "Camille Royer",
      subject: "Suivi projet Jarvis",
      excerpt: "Peux-tu valider le brief UI avant demain midi ?",
      time: "22:14",
      unread: true,
    },
    {
      id: "mail_02",
      from: "Cabinet Delvaux",
      subject: "Documents à signer",
      excerpt: "Trois pièces jointes en attente de ta relecture.",
      time: "20:41",
      unread: true,
    },
    {
      id: "mail_03",
      from: "Nora Benali",
      subject: "Stand-up reporté",
      excerpt: "On décale à 10:30 — dis-moi si ça te va.",
      time: "19:05",
      unread: false,
    },
    {
      id: "mail_04",
      from: "GitHub",
      subject: "[wake-up-JARVIS] CI failed on feat/home",
      excerpt: "lint passed · typecheck failed on AppShell props.",
      time: "18:22",
      unread: true,
    },
    {
      id: "mail_05",
      from: "Vercel",
      subject: "Deployment ready — preview",
      excerpt: "Preview URL is live for branch feat/home.",
      time: "17:58",
      unread: false,
    },
    {
      id: "mail_06",
      from: "Marc Lefèvre",
      subject: "Facture mars",
      excerpt: "La facture PDF est en pièce jointe, merci.",
      time: "16:10",
      unread: false,
    },
    {
      id: "mail_07",
      from: "Apple",
      subject: "Votre code de sécurité",
      excerpt: "Ne partage ce code avec personne. Expire dans 10 min.",
      time: "14:47",
      unread: false,
    },
    {
      id: "mail_08",
      from: "Léa Martin",
      subject: "Notes réunion design",
      excerpt: "J'ai résumé les points SKETCH + contrastes WCAG.",
      time: "12:03",
      unread: true,
    },
    {
      id: "mail_09",
      from: "Linear",
      subject: "3 issues assigned to you",
      excerpt: "feat/home shell · intro handoff · mail panel UI",
      time: "11:21",
      unread: false,
    },
    {
      id: "mail_10",
      from: "Support Stripe",
      subject: "Webhook endpoint updated",
      excerpt: "Your endpoint responded with 200 OK in test mode.",
      time: "09:44",
      unread: false,
    },
    {
      id: "mail_11",
      from: "Julie Aerts",
      subject: "Café demain ?",
      excerpt: "Place Flagey vers 9h si tu es libre.",
      time: "08:55",
      unread: false,
    },
    {
      id: "mail_12",
      from: "Notion",
      subject: "Weekly digest",
      excerpt: "12 pages updated in Workspace JARVIS.",
      time: "08:01",
      unread: false,
    },
    {
      id: "mail_13",
      from: "Banking",
      subject: "Virement reçu",
      excerpt: "Un virement de 420,00 EUR a été crédité.",
      time: "07:30",
      unread: true,
    },
    {
      id: "mail_14",
      from: "newsletter@tech.local",
      subject: "This week in TypeScript",
      excerpt: "Strict mode tips and Zod patterns for external data.",
      time: "06:12",
      unread: false,
    },
  ]);

export const MAIL_INBOX_TOTAL_AT_OPEN = MOCK_MAILS.length;
