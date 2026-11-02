import type { UserProfile } from "@/lib/schemas";

export interface ProfilePort {
  getProfile(): Promise<UserProfile | null>;
}
