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

interface AppContextValue {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  /** Ask to switch module — shows confirmation modal first. */
  requestModuleSwitch: (target: ModuleId) => void;
  /** Show the premium upgrade modal for a given feature. */
  showUpgrade: (featureName: string) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  nightLight: boolean;
  setNightLight: (value: boolean) => void;
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
  const [darkMode, setDarkModeState] = useState(false);
  const [nightLight, setNightLightState] = useState(false);
  const [appFont, setAppFont] = useState<AppFont>("DM Sans");

  const [pendingModule, setPendingModule] = useState<ModuleId | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);

  // Garante que LIGAR o Dark Mode DESLIGA a Luz Noturna
  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
    if (value) {
      setNightLightState(false);
    }
  }, []);

  // Garante que LIGAR a Luz Noturna DESLIGA o Dark Mode
  const setNightLight = useCallback((value: boolean) => {
    setNightLightState(value);
    if (value) {
      setDarkModeState(false);
    }
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
    const isNight = localStorage.getItem("lire.night-light") === "true";

    if (isDark) {
      setDarkModeState(true);
      setNightLightState(false);
    } else if (isNight) {
      setNightLightState(true);
      setDarkModeState(false);
    }

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

  // Gerencia as classes CSS no <html> e atualiza o localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Limpa ambas as classes antes de aplicar a ativa
    root.classList.remove("dark", "night");

    if (darkMode) {
      root.classList.add("dark");
    } else if (nightLight) {
      root.classList.add("night");
    }

    localStorage.setItem("lire.black-mode", String(darkMode));
    localStorage.setItem("lire.night-light", String(nightLight));
  }, [darkMode, nightLight]);

  // Atualiza a fonte global
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font", `"${appFont}", sans-serif`);
    localStorage.setItem("lire.app-font", appFont);
  }, [appFont]);

  const value = useMemo<AppContextValue>(
    () => ({
      module,
      setModule,
      isPremium,
      setIsPremium,
      requestModuleSwitch,
      showUpgrade,
      darkMode,
      setDarkMode,
      nightLight,
      setNightLight,
      appFont,
      setAppFont,
    }),
    [module, isPremium, requestModuleSwitch, showUpgrade, darkMode, setDarkMode, nightLight, setNightLight, appFont],
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
          setIsPremium(true);
          setUpgradeFeature(null);
        }}
      />
    </AppContext.Provider>
  );
}