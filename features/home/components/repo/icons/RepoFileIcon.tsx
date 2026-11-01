import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoFileIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M4 2.5h5.5L12 5v8.5H4z" strokeLinejoin="round" />
      <path d="M9.5 2.5V5H12" strokeLinejoin="round" />
    </svg>
  );
}
