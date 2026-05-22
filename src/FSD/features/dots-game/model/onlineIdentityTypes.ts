export type DotsOnlineIdentity = Readonly<{
  userId: string;
  displayName: string;
}>;

export type IdentityPhase = "resolving" | "authenticated" | "needs_name";

export type UseOnlineIdentityResult = Readonly<{
  identity: DotsOnlineIdentity | null;
  phase: IdentityPhase;
  storedDisplayName: string | null;
  setDisplayName: (name: string) => Promise<void>;
  isRegistering: boolean;
}>;
