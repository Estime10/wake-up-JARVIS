import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoFolderIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M2 4.5h4l1.2 1.5H14v7H2z" strokeLinejoin="round" />
    </svg>
  );
}
