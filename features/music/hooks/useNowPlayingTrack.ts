"use client";

import { useEffect, useRef, useState } from "react";

import { usePorts } from "@/app/ports-context";
import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";
import type { NowPlayingView } from "@/features/music/model/nowPlayingView";
import type { MusicTransportAction } from "@/lib/music/musicTransportAction";

const POLL_MS = 2000;
/** Garde l'état play/pause optimiste le temps que le probe se stabilise. */
const PLAYING_PIN_MS = 2500;

const IDLE_SNAPSHOT: NowPlayingSnapshot = {
  playing: false,
  source: "none",
  title: "",
  artist: "",
  app: "",
};

export type NowPlayingControls = {
  track: NowPlayingView;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
};

/** Poll Now Playing hôte + actions transport (via MusicPort). */
export function useNowPlayingTrack(): NowPlayingControls {
  const { music } = usePorts();
  const [snapshot, setSnapshot] = useState<NowPlayingSnapshot>(IDLE_SNAPSHOT);
  const lockRef = useRef(false);
  const playingPinRef = useRef<{ playing: boolean; until: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    const applySnapshot = (next: NowPlayingSnapshot) => {
      const pin = playingPinRef.current;
      if (pin && Date.now() < pin.until) {
        setSnapshot({ ...next, playing: pin.playing });
        return;
      }
      playingPinRef.current = null;
      setSnapshot(next);
    };

    const pull = async () => {
      if (lockRef.current || document.hidden) {
        return;
      }
      const next = await music.getNowPlaying(ac.signal);
      if (cancelled || !next) {
        return;
      }
      applySnapshot(next);
    };

    const onVisibility = () => {
      if (!document.hidden) {
        void pull();
      }
    };

    void pull();
    const pollId = window.setInterval(() => {
      void pull();
    }, POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      ac.abort();
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [music]);

  const run = (action: MusicTransportAction) => {
    if (lockRef.current) {
      return;
    }
    void (async () => {
      lockRef.current = true;
      if (action === "toggle") {
        setSnapshot((prev) => {
          const nextPlaying = !prev.playing;
          playingPinRef.current = {
            playing: nextPlaying,
            until: Date.now() + PLAYING_PIN_MS,
          };
          return { ...prev, playing: nextPlaying };
        });
      }
      try {
        const result = await music.transport(action);
        if (result?.accepted) {
          playingPinRef.current = null;
          setSnapshot(result.snapshot);
        } else if (action === "toggle") {
          playingPinRef.current = null;
        }
      } finally {
        lockRef.current = false;
      }
    })();
  };

  return {
    track: {
      title: snapshot.title,
      artist: snapshot.artist,
      playing: snapshot.playing,
      source: snapshot.source,
    },
    togglePlay: () => {
      run("toggle");
    },
    next: () => {
      run("next");
    },
    previous: () => {
      run("previous");
    },
  };
}
