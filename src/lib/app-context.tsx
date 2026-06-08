import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { ModuleSwitchModal } from "@/components/ModuleSwitchModal";
import { UpgradeModal } from "@/components/UpgradeModal";

export type ModuleId = "jano" | "minerva";

interface AppContextValue {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  /** Ask to switch module — shows confirmation modal first. */
  requestModuleSwitch: (target: ModuleId) => void;
  /** Show the premium upgrade modal for a given feature. */
  showUpgrade: (featureName: string) => void;
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

  const [pendingModule, setPendingModule] = useState<ModuleId | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);

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

  const value = useMemo<AppContextValue>(
    () => ({ module, setModule, isPremium, setIsPremium, requestModuleSwitch, showUpgrade }),
    [module, isPremium, requestModuleSwitch, showUpgrade],
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
