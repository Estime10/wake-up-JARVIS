"use client";

import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { HudModal } from "@/components/ui/HudModal";
import { Select } from "@/components/ui/Select";
import {
  addCustomPhraseRule,
  loadCustomPhraseRules,
  type CustomPhraseRule,
} from "@/features/assistant/model/customPhraseRules";
import {
  filterCatalogEntries,
  listBuiltinCatalogEntries,
  type CatalogEntry,
} from "@/features/assistant/model/intentCatalogEntries";
import {
  INTENT_KIND_OPTIONS,
  type IntentKind,
} from "@/features/assistant/model/intentKindOptions";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { HudOverlay } from "@/features/home/components/HudOverlay";
import {
  mainSectionBoxStyle,
  useMainSectionBox,
} from "@/features/home/hooks/useMainSectionBox";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { t } from "@/lib/i18n";

type PhraseCatalogModalProps = {
  open: boolean;
  /** Phrase non reconnue — préremplit le formulaire d’ajout. */
  seedPhrase?: string;
  onClose: () => void;
};

function kindLabel(kind: CatalogEntry["kind"]): string {
  const option = INTENT_KIND_OPTIONS.find((item) => item.kind === kind);
  return option ? t(option.labelKey) : kind;
}

/**
 * Catalogue des phrases + ajout perso (localStorage).
 * Monter avec une `key` (seed) pour réinitialiser à l’ouverture.
 */
export function PhraseCatalogModal({
  open,
  seedPhrase = "",
  onClose,
}: PhraseCatalogModalProps) {
  const idPrefix = useId();
  const box = useMainSectionBox(open);
  useScrollLock(open);
  const [query, setQuery] = useState("");
  const [customRules, setCustomRules] = useState<CustomPhraseRule[]>(() =>
    loadCustomPhraseRules(),
  );
  const [draftPhrase, setDraftPhrase] = useState(seedPhrase);
  const [kind, setKind] = useState<IntentKind>("help");
  const [label, setLabel] = useState("");
  const [repoQuery, setRepoQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [fileQuery, setFileQuery] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const selected = INTENT_KIND_OPTIONS.find((item) => item.kind === kind);
  const meaningOptions = useMemo(
    () =>
      INTENT_KIND_OPTIONS.map((option) => ({
        value: option.kind,
        label: t(option.labelKey),
      })),
    [],
  );

  const entries = useMemo(() => {
    const customEntries: CatalogEntry[] = customRules.map((rule) => ({
      phrase: rule.phrase,
      kind: rule.kind,
      source: "custom" as const,
    }));
    return filterCatalogEntries(
      [...customEntries, ...listBuiltinCatalogEntries()],
      query,
    );
  }, [customRules, query]);

  function handleSave(): void {
    const phrase = draftPhrase.trim();
    if (phrase.length === 0) {
      return;
    }
    if (
      selected?.fields.includes("label") &&
      kind !== "mail.count" &&
      !label.trim()
    ) {
      return;
    }
    if (
      selected?.fields.includes("query") &&
      kind !== "files.open" &&
      !fileQuery.trim()
    ) {
      return;
    }
    if (kind === "files.goto" && !folder.trim()) {
      return;
    }

    const next = addCustomPhraseRule({
      phrase,
      kind,
      ...(label.trim() ? { label: label.trim() } : {}),
      ...(repoQuery.trim() ? { repoQuery: repoQuery.trim() } : {}),
      ...(folder.trim() ? { folder: folder.trim() } : {}),
      ...(fileQuery.trim() ? { query: fileQuery.trim() } : {}),
    });
    setCustomRules(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2200);
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <HudOverlay visible className="z-[72]" />
      <Button
        type="button"
        variant="ghost"
        size="bare"
        aria-label={t("assistant.phraseCatalogClose")}
        className="pointer-events-auto fixed z-[72] block cursor-default rounded-none bg-transparent opacity-100"
        style={mainSectionBoxStyle(box)}
        onClick={onClose}
      >
        <span className="sr-only">{t("assistant.phraseCatalogClose")}</span>
      </Button>

      <div
        className="pointer-events-none fixed z-[73] flex items-center justify-center px-2 opacity-100"
        style={mainSectionBoxStyle(box)}
      >
        <HudModal
          aria-label={t("assistant.phraseCatalogTitle")}
          className="pointer-events-auto flex h-[min(90vh,52rem)] w-full max-w-5xl flex-col gap-3 p-4 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="t-mono text-sm tracking-wide text-text uppercase">
              {t("assistant.phraseCatalogTitle")}
            </h2>
            <Button type="button" variant="hud" size="bare" onClick={onClose}>
              {t("assistant.phraseCatalogClose")}
            </Button>
          </div>

          <AuthTextField
            id={`${idPrefix}-search`}
            label={t("assistant.phraseCatalogSearchLabel")}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("assistant.phraseCatalogSearch")}
            autoComplete="off"
          />

          <ul
            data-scroll-lock-allow="true"
            className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-1"
          >
            {entries.length === 0 ? (
              <li className="t-body text-sm text-text-muted">
                {t("assistant.phraseCatalogEmpty")}
              </li>
            ) : (
              entries.slice(0, 200).map((entry) => (
                <li
                  key={`${entry.source}-${entry.kind}-${entry.phrase}`}
                  className="border-b border-line-subtle/60 py-2"
                >
                  <p className="t-body text-sm text-text">{entry.phrase}</p>
                  <p className="t-mono mt-0.5 text-dial text-text-muted uppercase">
                    {kindLabel(entry.kind)}
                    {" · "}
                    {entry.source === "custom"
                      ? t("assistant.phraseCatalogCustom")
                      : t("assistant.phraseCatalogBuiltin")}
                  </p>
                </li>
              ))
            )}
          </ul>

          <div className="shrink-0 space-y-3 border-t border-line-subtle pt-3">
            <h3 className="t-mono text-dial tracking-wide text-text-muted uppercase">
              {t("assistant.phraseCatalogAddTitle")}
            </h3>
            <AuthTextField
              id={`${idPrefix}-phrase`}
              label={t("assistant.phraseCatalogAddPhrase")}
              value={draftPhrase}
              onChange={(event) => setDraftPhrase(event.target.value)}
              autoComplete="off"
            />
            <div className="flex flex-col gap-1.5">
              <span className="t-label text-text-muted">
                {t("assistant.phraseCatalogAddMeaning")}
              </span>
              <Select
                id={`${idPrefix}-meaning`}
                aria-label={t("assistant.phraseCatalogAddMeaning")}
                value={kind}
                options={meaningOptions}
                placement="up"
                onChange={(value) => setKind(value as IntentKind)}
              />
            </div>
            {selected?.fields.includes("label") ? (
              <AuthTextField
                id={`${idPrefix}-label`}
                label={t("assistant.phraseCatalogAddLabel")}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                autoComplete="off"
              />
            ) : null}
            {selected?.fields.includes("repoQuery") ? (
              <AuthTextField
                id={`${idPrefix}-repo`}
                label={t("assistant.phraseCatalogAddRepo")}
                value={repoQuery}
                onChange={(event) => setRepoQuery(event.target.value)}
                autoComplete="off"
              />
            ) : null}
            {selected?.fields.includes("folder") ? (
              <AuthTextField
                id={`${idPrefix}-folder`}
                label={t("assistant.phraseCatalogAddFolder")}
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                autoComplete="off"
              />
            ) : null}
            {selected?.fields.includes("query") ? (
              <AuthTextField
                id={`${idPrefix}-file`}
                label={t("assistant.phraseCatalogAddFile")}
                value={fileQuery}
                onChange={(event) => setFileQuery(event.target.value)}
                autoComplete="off"
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="button"
                variant="hud"
                size="bare"
                onClick={handleSave}
              >
                {t("assistant.phraseCatalogAddSubmit")}
              </Button>
              {savedFlash ? (
                <p className="t-body text-sm text-success" role="status">
                  {t("assistant.phraseCatalogAddOk")}
                </p>
              ) : null}
            </div>
          </div>
        </HudModal>
      </div>
    </>
  );
}
