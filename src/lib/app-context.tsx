import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { ModuleSwitchModal } from "@/components/ModuleSwitchModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";

export type ModuleId = "jano" | "minerva";
export type AppFont = "DM Sans" | "OpenDyslexic" | "OpenDyslexicAlta" | "OpenDyslexicMono";
export type SubscriptionPlan = "free" | "monthly" | "annual";

interface AppContextValue {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
  userName: string;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  subscriptionPlan: SubscriptionPlan;
  setSubscriptionPlan: (value: SubscriptionPlan) => void;
  /** Ask to switch module — shows confirmation modal first. */
  requestModuleSwitch: (target: ModuleId) => void;
  /** Show the premium upgrade modal for a given feature. */
  showUpgrade: (featureName: string) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  appFont: AppFont;
  setAppFont: (value: AppFont) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [module, setModule] = useState<ModuleId>("jano");
  const [userName, setUserName] = useState("Usuário");
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free");
  const [planLoaded, setPlanLoaded] = useState(false);
  const [darkMode, setDarkModeState] = useState(false);
  const [appFont, setAppFont] = useState<AppFont>("DM Sans");

  const [pendingModule, setPendingModule] = useState<ModuleId | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);

  const persistModule = useCallback(async (nextModule: ModuleId) => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;

    const { error } = await supabase.from("usuario").upsert(
      {
        id: user.id,
        nome: user.user_metadata.name || user.email?.split("@")[0] || "Usuário",
        provedor_login: user.email,
        perfil_principal: nextModule.toUpperCase(),
      },
      { onConflict: "id" },
    );

    if (error) console.error("Não foi possível salvar o módulo do usuário.", error);
  }, []);

  const changeModule = useCallback(
    (nextModule: ModuleId) => {
      setModule(nextModule);
      void persistModule(nextModule);
    },
    [persistModule],
  );

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  const requestModuleSwitch = useCallback((target: ModuleId) => {
    setPendingModule(target);
  }, []);

  const confirmSwitch = useCallback(() => {
    if (!pendingModule) return;
    changeModule(pendingModule);
    const target = pendingModule;
    setPendingModule(null);
    navigate({ to: target === "jano" ? "/jano" : "/minerva" });
  }, [pendingModule, navigate, changeModule]);

  const showUpgrade = useCallback((featureName: string) => {
    setUpgradeFeature(featureName);
  }, []);

  // Carrega as configurações salvas na inicialização
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user || !mounted) return;

      const { data: profile } = await supabase
        .from("usuario")
        .select("nome, perfil_principal")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      setUserName(profile?.nome || user.user_metadata.name || user.email?.split("@")[0] || "Usuário");
      if (profile?.perfil_principal === "MINERVA" || profile?.perfil_principal === "JANO") {
        setModule(profile.perfil_principal.toLowerCase() as ModuleId);
      }
    };

    void loadProfile();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    const isDark = localStorage.getItem("lire.black-mode") === "true";
    setDarkModeState(isDark);
    localStorage.removeItem("lire.night-light");

    const storedPlan = localStorage.getItem("lire.subscription-plan");
    if (storedPlan === "free" || storedPlan === "monthly" || storedPlan === "annual") {
      setSubscriptionPlan(storedPlan);
      setIsPremium(storedPlan !== "free");
    }
    setPlanLoaded(true);

    const storedFont = localStorage.getItem("lire.app-font");
    if (
      storedFont === "DM Sans" ||
      storedFont === "OpenDyslexic" ||
      storedFont === "OpenDyslexicAlta" ||
      storedFont === "OpenDyslexicMono"
    ) {
      setAppFont(storedFont);
    }
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", darkMode);

    localStorage.setItem("lire.black-mode", String(darkMode));
  }, [darkMode]);

  // Atualiza a fonte global
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font", `"${appFont}", sans-serif`);
    localStorage.setItem("lire.app-font", appFont);
  }, [appFont]);

  useEffect(() => {
    if (planLoaded) localStorage.setItem("lire.subscription-plan", subscriptionPlan);
  }, [planLoaded, subscriptionPlan]);

  const value = useMemo<AppContextValue>(
    () => ({
      module,
      setModule: changeModule,
      userName,
      isPremium,
      setIsPremium,
      subscriptionPlan,
      setSubscriptionPlan,
      requestModuleSwitch,
      showUpgrade,
      darkMode,
      setDarkMode,
      appFont,
      setAppFont,
    }),
    [module, changeModule, userName, isPremium, subscriptionPlan, requestModuleSwitch, showUpgrade, darkMode, setDarkMode, appFont],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <ModuleSwitchModal
        open={pendingModule !== null}
        target={pendingModule}
        onCancel={() => setPendingModule(null)}
        onConfirm={confirmSwitch}
      />
      <UpgradeModal
        open={upgradeFeature !== null}
        featureName={upgradeFeature ?? ""}
        onClose={() => setUpgradeFeature(null)}
        onSubscribe={() => {
          setUpgradeFeature(null);
          navigate({ to: "/plans" });
        }}
      />
    </AppContext.Provider>
  );
}