/** Icône micro — décorative (label sur le bouton parent). */
export function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 11v1.5a5.5 5.5 0 0 0 11 0V11" />
        <path d="M12 18v3" />
        <path d="M8.5 21h7" />
      </g>
    </svg>
  );
}
