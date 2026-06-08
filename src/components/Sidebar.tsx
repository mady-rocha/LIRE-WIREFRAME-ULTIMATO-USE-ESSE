import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  FileText,
  Newspaper,
  Settings,
  RefreshCw,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/app-context";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const { module, requestModuleSwitch } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const minerva = module === "minerva";

  const items: NavItem[] = minerva
    ? [
        { label: "Início", to: "/minerva", icon: Home },
        { label: "Blog", to: "/blog", icon: Newspaper },
        { label: "Configurações", to: "/settings", icon: Settings },
      ]
    : [
        { label: "Início", to: "/jano", icon: Home },
        { label: "Meus Documentos", to: "/jano/reader", icon: FileText },
        { label: "Blog", to: "/blog", icon: Newspaper },
        { label: "Configurações", to: "/settings", icon: Settings },
      ];

  return (
    <aside
      role="navigation"
      aria-label="Navegação principal"
      aria-hidden={!open}
      className={`sidebar-shadow fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <Logo size={34} variant="light" showWordmark />
        <button
          onClick={onClose}
          aria-label="Fechar menu"
          className="rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center rounded-lg font-medium transition-colors ${
                minerva ? "gap-4 px-4 py-4 text-lg" : "gap-3 px-4 py-3 text-base"
              } ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={minerva ? "h-7 w-7" : "h-5 w-5"} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={() => {
            requestModuleSwitch(minerva ? "jano" : "minerva");
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border px-4 py-3 text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Trocar para Módulo {minerva ? "Jano" : "Minerva"}
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          AM
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Ana Moraes</p>
          <p className="text-xs text-sidebar-foreground/60">
            Módulo {minerva ? "Minerva" : "Jano"}
          </p>
        </div>
      </div>
    </aside>
  );
}
