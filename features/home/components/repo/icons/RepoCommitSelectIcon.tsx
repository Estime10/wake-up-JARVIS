import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

/** Flèche haut-droite — commit sélectionné (réf. DA). */
export function RepoCommitSelectIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path
        d="M5 11 11 5M6.5 5H11v4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
