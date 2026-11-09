import type { NowPlayingIdentity } from "@/features/music/model/nowPlayingIdentity";

type NowPlayingMetaProps = {
  identity: NowPlayingIdentity;
};

/** Ligne artiste — titre. */
export function NowPlayingMeta({ identity }: NowPlayingMetaProps) {
  return (
    <p className="t-mono truncate text-center text-sm leading-none text-text">
      {identity.artist}
      <span aria-hidden> — </span>
      {identity.title}
    </p>
  );
}
