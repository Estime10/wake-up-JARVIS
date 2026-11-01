import type { ReactNode } from "react";

type RepoPreviewMessageProps = {
  icon: ReactNode;
  title: string;
  body: string;
};

/** État aperçu centré (trop gros, binaire, protégé, offline…). */
export function RepoPreviewMessage({
  icon,
  title,
  body,
}: RepoPreviewMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon}
      <p className="t-body text-sm text-text">{title}</p>
      <p className="t-body max-w-sm text-sm text-text-muted">{body}</p>
    </div>
  );
}
