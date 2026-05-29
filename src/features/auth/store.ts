import { create } from "zustand";
import type { AuthSession, User } from "@/types";

interface AuthState {
  session: AuthSession | null;
  user: User | null;
  tenantName: string;
  isLoading: boolean;
  isHydrated: boolean;
  setAuth: (session: AuthSession, user: User, tenantName: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  tenantName: "",
  isLoading: true,
  isHydrated: false,
  setAuth: (session, user, tenantName) =>
    set({ session, user, tenantName, isLoading: false, isHydrated: true }),
  clearAuth: () =>
    set({
      session: null,
      user: null,
      tenantName: "",
      isLoading: false,
      isHydrated: true,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));

export function usePermissions(): string[] {
  return useAuthStore((s) => s.session?.permissionIds ?? []);
}

export function useRequestContext() {
  const session = useAuthStore((s) => s.session);
  return {
    tenantId: session?.tenantId ?? "",
    userId: session?.userId,
  };
}
