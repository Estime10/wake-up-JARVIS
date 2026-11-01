import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoOfflineDocIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M10 6h9l5 5v15H10z" strokeLinejoin="round" />
      <path d="M19 6v5h5M8 8l16 16" strokeLinecap="round" />
    </svg>
  );
}
