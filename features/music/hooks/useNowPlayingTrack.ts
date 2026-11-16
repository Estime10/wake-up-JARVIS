"use client";

import { useEffect, useState } from "react";

import { usePorts } from "@/app/ports-context";
import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";
import type { NowPlayingView } from "@/features/music/model/nowPlayingView";
import { nowPlayingSnapshotSchema } from "@/lib/music/nowPlayingSnapshot";

const POLL_MS = 2000;

const IDLE_SNAPSHOT: NowPlayingSnapshot = {
  playing: false,
  source: "none",
  title: "",
  artist: "",
  app: "",
};

export type NowPlayingControls = {
  track: NowPlayingView;
};

/** Poll Now Playing hôte (lecture seule — pas de transport UI). */
export function useNowPlayingTrack(): NowPlayingControls {
  const { music } = usePorts();
  const [snapshot, setSnapshot] = useState<NowPlayingSnapshot>(IDLE_SNAPSHOT);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    const pull = async () => {
      if (document.hidden) {
        return;
      }
      const next = await music.getNowPlaying(ac.signal);
      if (cancelled || !next) {
        return;
      }
      setSnapshot(next);
    };

    const onVisibility = () => {
      if (!document.hidden) {
        void pull();
      }
    };

    const onNativePush = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      const parsed = nowPlayingSnapshotSchema.safeParse(detail);
      if (cancelled || !parsed.success) {
        return;
      }
      setSnapshot(parsed.data);
    };
    window.addEventListener("elsa-now-playing", onNativePush);

    void pull();
    const bootId = window.setTimeout(() => {
      void pull();
    }, 300);
    const pollId = window.setInterval(() => {
      void pull();
    }, POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      ac.abort();
      window.clearTimeout(bootId);
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("elsa-now-playing", onNativePush);
    };
  }, [music]);

  return {
    track: {
      title: snapshot.title,
      artist: snapshot.artist,
      playing: snapshot.playing,
      source: snapshot.source,
    },
  };
}
