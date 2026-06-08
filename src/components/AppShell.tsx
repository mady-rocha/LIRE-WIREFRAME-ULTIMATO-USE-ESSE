import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";

interface Props {
  children: ReactNode;
  title?: string;
  /** Optional extra content rendered on the right of the top bar. */
  headerExtra?: ReactNode;
  /** Hide the default top bar (e.g. for full-bleed editor screens). */
  bare?: boolean;
}

export function AppShell({ children, title, headerExtra, bare }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-dvh bg-background">
      {/* Page content (blurred when sidebar is open) */}
      <div
        className={`min-h-dvh transition-[filter] duration-300 ${
          open ? "pointer-events-none select-none blur-sm" : ""
        }`}
        aria-hidden={open}
      >
        {!bare && (
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="rounded-md p-2 text-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo size={26} showWordmark />
            {title && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <h1 className="truncate text-base font-semibold">{title}</h1>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">{headerExtra}</div>
          </header>
        )}
        {bare && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="fixed left-4 top-4 z-30 rounded-md bg-background/90 p-2 text-foreground shadow hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <main>{children}</main>
      </div>

      {/* Click-outside layer to close + reinforce focus */}
      {open && (
        <button
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-brand-dark/25"
        />
      )}

      <Sidebar open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
