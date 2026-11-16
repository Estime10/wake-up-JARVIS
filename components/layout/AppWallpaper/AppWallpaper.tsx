/**
 * Fond app — wallpaper + teinte `bg` semi-transparente.
 * `<img>` (pas `style=`) : CSP prod autorise img-src 'self', bloque style inline.
 */
export function AppWallpaper() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fond full-bleed, pas de LCP hero */}
      <img
        src="/wallpaper/davincaht-wallpaper.png"
        alt=""
        className="absolute inset-0 size-full object-cover"
        decoding="async"
      />
      {/* Teinte DA — wallpaper visible mais discret. */}
      <div className="absolute inset-0 bg-bg/70" />
    </div>
  );
}
