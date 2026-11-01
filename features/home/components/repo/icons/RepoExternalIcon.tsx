import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoExternalIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M6.5 3.5H3.5v9h9v-3" strokeLinejoin="round" />
      <path d="M9 3.5h3.5V7M12.5 3.5 7 9" strokeLinecap="round" />
    </svg>
  );
}
