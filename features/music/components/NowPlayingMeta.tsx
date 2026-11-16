import type { NowPlayingIdentity } from "@/features/music/model/nowPlayingIdentity";

type NowPlayingMetaProps = {
  identity: NowPlayingIdentity;
};

/**
 * Titre = même police que le subject mail (`t-content truncate leading-snug`).
 * Artiste = uppercase.
 */
export function NowPlayingMeta({ identity }: NowPlayingMetaProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <p className="t-content w-full truncate leading-snug">{identity.title}</p>
      <p className="t-content w-full truncate leading-snug uppercase text-text/70">
        {identity.artist}
      </p>
    </div>
  );
}
