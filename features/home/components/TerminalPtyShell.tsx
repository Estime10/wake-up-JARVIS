"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

import {
  listenTerminalPtyData,
  listenTerminalPtyExit,
  terminalPtyResize,
  terminalPtyStart,
  terminalPtyStop,
  terminalPtyWrite,
} from "@/features/home/tauri/terminalPty";
import { t } from "@/lib/i18n";

import "@xterm/xterm/css/xterm.css";

type TerminalPtyShellProps = {
  active: boolean;
};

/**
 * Vrai zsh (PTY) — shell Tauri uniquement.
 */
export function TerminalPtyShell({ active }: TerminalPtyShellProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!active || !hostRef.current) {
      return;
    }

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "var(--font-mono), ui-monospace, monospace",
      fontSize: 13,
      lineHeight: 1.35,
      letterSpacing: 0.5,
      theme: {
        background: "#0B0B0C",
        foreground: "#ECEAE4",
        cursor: "#ECEAE4",
        selectionBackground: "#3A3A3E",
      },
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(hostRef.current);
    fit.fit();
    term.focus();

    termRef.current = term;
    fitRef.current = fit;

    let unlistenData: (() => void) | undefined;
    let unlistenExit: (() => void) | undefined;
    let disposed = false;

    const cols = term.cols;
    const rows = term.rows;

    void (async () => {
      try {
        await terminalPtyStart(cols, rows);
        if (disposed) {
          await terminalPtyStop();
          return;
        }
        unlistenData = await listenTerminalPtyData((chunk) => {
          term.write(chunk);
        });
        unlistenExit = await listenTerminalPtyExit(() => {
          term.writeln("\r\n[session zsh terminée]");
        });
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "pty_start_failed";
        term.writeln(`elsa: impossible de démarrer zsh — ${message}`);
      }
    })();

    const onData = term.onData((data) => {
      void terminalPtyWrite(data);
    });

    const onResize = term.onResize(({ cols: c, rows: r }) => {
      void terminalPtyResize(c, r);
    });

    const ro = new ResizeObserver(() => {
      fit.fit();
    });
    ro.observe(hostRef.current);

    return () => {
      disposed = true;
      unlistenData?.();
      unlistenExit?.();
      onData.dispose();
      onResize.dispose();
      ro.disconnect();
      void terminalPtyStop();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      className="relative z-10 h-full min-h-0 px-4 py-4 sm:px-5 sm:py-5"
      aria-label={t("home.terminalShellLabel")}
    >
      <div ref={hostRef} className="h-full min-h-0 w-full overflow-hidden" />
    </div>
  );
}
