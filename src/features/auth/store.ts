import { create } from "zustand";
import type { AuthSession, User } from "@/types";

interface AuthState {
  session: AuthSession | null;
  user: User | null;
  tenantName: string;
  mustChangePassword: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setAuth: (session: AuthSession, user: User, tenantName: string, mustChangePassword?: boolean) => void;
  clearAuth: () => void;
  setMustChangePassword: (value: boolean) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  tenantName: "",
  mustChangePassword: false,
  isLoading: true,
  isHydrated: false,
  setAuth: (session, user, tenantName, mustChangePassword = false) =>
    set({ session, user, tenantName, mustChangePassword, isLoading: false, isHydrated: true }),
  clearAuth: () =>
    set({
      session: null,
      user: null,
      tenantName: "",
      mustChangePassword: false,
      isLoading: false,
      isHydrated: true,
    }),
  setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
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
