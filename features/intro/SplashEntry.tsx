"use client";

import { useRouter } from "next/navigation";

import { SplashScreen } from "@/features/intro/components/SplashScreen";

/**
 * Point d'entrée `/` — intro, puis navigation vers `/home`.
 */
export function SplashEntry() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh bg-bg text-text">
      <SplashScreen mode="full" onComplete={() => router.replace("/home")} />
    </div>
  );
}
