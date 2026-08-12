import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { SystemRole } from "./database.types";
import { supabase } from "./supabase";

type Profile = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: SystemRole;
  department_id: string | null;
  avatar_color: string;
  brandIds: string[];
};

type AppContextType = {
  currentUser: Profile | null;
  currentBrandId: string;
  currentRole: SystemRole;
  isLoading: boolean;
  setCurrentBrandId: (id: string) => void;
};

const AppContext = createContext<AppContextType>({
  currentUser: null,
  currentBrandId: "danfe",
  currentRole: "team_member",
  isLoading: true,
  setCurrentBrandId: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentBrandId, setCurrentBrandId] = useState("danfe");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("*, profile_brands(brand_id)")
        .eq("id", userId)
        .single();

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = data as any;
        const brandIds: string[] = (d.profile_brands ?? []).map((pb: { brand_id: string }) => pb.brand_id);
        setCurrentUser({
          id: d.id,
          name: d.name,
          email: d.email,
          initials: d.initials,
          role: d.role,
          department_id: d.department_id,
          avatar_color: d.avatar_color,
          brandIds,
        });
        // Default to first brand the user belongs to
        if (brandIds.length > 0 && !brandIds.includes(currentBrandId)) {
          setCurrentBrandId(brandIds[0]);
        }
      }
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentBrandId,
        currentRole: currentUser?.role ?? "team_member",
        isLoading,
        setCurrentBrandId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
