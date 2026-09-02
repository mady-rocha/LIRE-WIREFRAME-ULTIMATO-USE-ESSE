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

export type ModuleId = "jano" | "minerva";
export type AppFont = "DM Sans" | "OpenDyslexic" | "OpenDyslexicAlta" | "OpenDyslexicMono";
export type SubscriptionPlan = "free" | "monthly" | "annual";

interface AppContextValue {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
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
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free");
  const [planLoaded, setPlanLoaded] = useState(false);
  const [darkMode, setDarkModeState] = useState(false);
  const [appFont, setAppFont] = useState<AppFont>("DM Sans");

  const [pendingModule, setPendingModule] = useState<ModuleId | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  const requestModuleSwitch = useCallback((target: ModuleId) => {
    setPendingModule(target);
  }, []);

  const confirmSwitch = useCallback(() => {
    if (!pendingModule) return;
    setModule(pendingModule);
    const target = pendingModule;
    setPendingModule(null);
    navigate({ to: target === "jano" ? "/jano" : "/minerva" });
  }, [pendingModule, navigate]);

  const showUpgrade = useCallback((featureName: string) => {
    setUpgradeFeature(featureName);
  }, []);

  // Carrega as configurações salvas na inicialização
  useEffect(() => {
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
      setModule,
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
    [module, isPremium, subscriptionPlan, requestModuleSwitch, showUpgrade, darkMode, setDarkMode, appFont],
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