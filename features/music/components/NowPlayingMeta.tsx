import type { NowPlayingIdentity } from "@/features/music/model/nowPlayingIdentity";

type NowPlayingMetaProps = {
  identity: NowPlayingIdentity;
};

/** Titre au-dessus, artiste en dessous. */
export function NowPlayingMeta({ identity }: NowPlayingMetaProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <p className="t-content w-full truncate leading-snug">{identity.title}</p>
      <p className="t-content w-full truncate text-sm leading-snug text-text/70">
        {identity.artist}
      </p>
    </div>
  );
}
