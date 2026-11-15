/**
 * Fond app — wallpaper + teinte `bg` semi-transparente.
 * Calque fixe sous le contenu (jamais d’interaction).
 */
export function AppWallpaper() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/wallpaper/davincaht-wallpaper.png')",
        }}
      />
      {/* Teinte DA — wallpaper visible mais discret. */}
      <div className="absolute inset-0 bg-bg/85" />
    </div>
  );
}
