import type { NowPlayingIdentity } from "@/features/music/model/nowPlayingIdentity";

type NowPlayingMetaProps = {
  identity: NowPlayingIdentity;
};

/** Ligne artiste — titre. */
export function NowPlayingMeta({ identity }: NowPlayingMetaProps) {
  return (
    <p className="t-content truncate text-center leading-snug">
      {identity.artist}
      <span aria-hidden> — </span>
      {identity.title}
    </p>
  );
}
