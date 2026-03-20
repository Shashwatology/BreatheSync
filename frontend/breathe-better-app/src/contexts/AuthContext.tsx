import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role?: string; // "patient" or "doctor"
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  loginAsGuest: () => { },
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // Attempt to fetch profile info including role if it exists
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, email, role")
      .eq("user_id", userId)
      .single();
      
    if (data) {
      setProfile({
        ...data,
        // Default to patient if no role is assigned
        role: data.role || "patient"
      });
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;

    const setupSessionRefresh = (currentSession: Session | null) => {
      // Clear existing timer
      if (refreshTimer) clearTimeout(refreshTimer);

      if (currentSession?.expires_at) {
        // Calculate milliseconds until token expires
        // Subtract 60 seconds (60000ms) to refresh *before* it actually expires
        const expiresAtMs = currentSession.expires_at * 1000;
        const timeUntilRefresh = expiresAtMs - Date.now() - 60000;

        if (timeUntilRefresh > 0) {
          refreshTimer = setTimeout(async () => {
            console.log("Proactively refreshing Supabase session...");
            // This triggers token rotation internally
            await supabase.auth.getSession();
          }, timeUntilRefresh);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        setupSessionRefresh(currentSession);

        if (currentSession?.user) {
          // Force redirect if we just signed in and are on a public page
          if (event === "SIGNED_IN") {
             const path = window.location.pathname;
             if (path === "/" || path === "/login" || path === "/signup") {
               console.log("Auth Event: SIGNED_IN detected on public page. Redirecting to dashboard...");
               window.location.href = "/dashboard";
             }
          }

          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(currentSession.user.id), 0);

          // Send welcome email for first-time sign-ins (example placeholder)
          if (event === "SIGNED_IN" && window.location.search.includes("welcome=true")) {
            const email = currentSession.user.email;
            const name = currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || "";
            if (email) {
              supabase.functions.invoke("send-welcome-email", {
                body: { email, name },
              }).catch(console.error);
            }
          }
        } else {
          setProfile(null);
        }
        
        // Prevent INITIAL_SESSION from unblocking the loading state prematurely
        // which causes React Router to redirect to /login and strip the OAuth hash
        if (event !== "INITIAL_SESSION") {
          setLoading(false);
        }
      }
    );

    // Initial load check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        setupSessionRefresh(initialSession);
        fetchProfile(initialSession.user.id);
      } else {
        // Check for guest user in localStorage
        const guestData = localStorage.getItem("bs_guest_user");
        if (guestData) {
          const mockUser = JSON.parse(guestData);
          setUser(mockUser);
          setProfile({
            full_name: mockUser.user_metadata.full_name,
            avatar_url: null,
            email: mockUser.email,
            role: "patient" // Guests default to patient view
          });
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  const loginAsGuest = () => {
    const mockUser: any = {
      id: "guest-user-123",
      email: "guest@breathsync.demo",
      user_metadata: { full_name: "Guest Explorer" },
      aud: "authenticated",
      role: "authenticated",
    };
    setUser(mockUser);
    setProfile({
      full_name: mockUser.user_metadata.full_name,
      avatar_url: null,
      email: mockUser.email,
      role: "patient" // Guests default to patient view
    });
    localStorage.setItem("bs_guest_user", JSON.stringify(mockUser));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("bs_guest_user");
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, loginAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

