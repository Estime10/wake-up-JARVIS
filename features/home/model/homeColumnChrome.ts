/**
 * Bandeau haut des 3 colonnes home — même padding vertical
 * (horloge | nav | Studio) pour alignement UI.
 */
export const HOME_COLUMN_HEADER = "z-20 flex w-full shrink-0 items-center py-3";

/**
 * Inset liquid-glass sides — même valeur que le `bottom` du composer
 * pour coller le bas de l’input à la fin des panneaux G/D.
 */
export const HOME_SIDE_INSET = "m-3 sm:m-4";

/** Bas du composer = bas des liquid-glass (`HOME_SIDE_INSET`). */
export const HOME_COMPOSER_BOTTOM = "bottom-3 sm:bottom-4";

/**
 * Padding interne unique des liquid-glass G/D
 * (pas de second pl/pr empilé dans les enfants).
 */
export const HOME_SIDE_CONTENT_PAD = "p-4";

/**
 * Largeur commune nav centre + composer — même axe vertical.
 */
export const HOME_CENTER_CHROME_WIDTH =
  "w-full max-w-[18rem] sm:max-w-[20rem] lg:max-w-[22rem]";
