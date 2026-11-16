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
      <p className="t-content text-base leading-snug">{title}</p>
      <p className="t-content max-w-sm text-base leading-snug">{body}</p>
    </div>
  );
}
