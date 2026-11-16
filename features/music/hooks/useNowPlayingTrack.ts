"use client";

import { useEffect, useState } from "react";

import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";
import type { NowPlayingView } from "@/features/music/model/nowPlayingView";
import { fetchNowPlayingSnapshot } from "@/features/music/services/fetchNowPlayingSnapshot";

const POLL_MS = 2000;

const IDLE_SNAPSHOT: NowPlayingSnapshot = {
  playing: false,
  source: "none",
  title: "",
  artist: "",
};

/** Poll macOS Now Playing → titre / artiste / source. */
export function useNowPlayingTrack(): NowPlayingView {
  const [snapshot, setSnapshot] = useState<NowPlayingSnapshot>(IDLE_SNAPSHOT);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    const pull = async () => {
      const next = await fetchNowPlayingSnapshot(ac.signal);
      if (cancelled || !next) {
        return;
      }
      setSnapshot(next);
    };

    void pull();
    const pollId = window.setInterval(() => {
      void pull();
    }, POLL_MS);

    return () => {
      cancelled = true;
      ac.abort();
      window.clearInterval(pollId);
    };
  }, []);

  return {
    title: snapshot.title,
    artist: snapshot.artist,
    playing: snapshot.playing,
    source: snapshot.source,
  };
}
