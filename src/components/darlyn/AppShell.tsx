import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Minus, Square, X, Plus, Settings2, PanelLeft, Pencil, Trash2, Check } from "lucide-react";
import { DarlynAvatar } from "./DarlynAvatar";
import { SettingsDialog } from "./SettingsDialog";
import { chatStore, useThreads } from "@/lib/chat-store";
import { useSettings, type Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface ShellCtx {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  settings: Settings;
  openSettings: () => void;
}
const Ctx = createContext<ShellCtx | null>(null);
export const useShell = () => useContext(Ctx)!;

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, update } = useSettings();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setSidebarOpen(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <Ctx.Provider
      value={{
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((o) => !o),
        settings,
        openSettings: () => setSettingsOpen(true),
      }}
    >
      <div className="flex h-dvh min-h-[360px] min-w-[480px] flex-col overflow-hidden bg-background">
        <TitleBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar open={sidebarOpen} />
          <main className="bg-dusk flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        update={update}
      />
    </Ctx.Provider>
  );
}

function TitleBar() {
  return (
    <div className="flex h-8 shrink-0 select-none items-center justify-between border-b border-border bg-titlebar pl-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <DarlynAvatar size={16} className="ring-0" />
        <span className="font-medium tracking-wide">Darlyn</span>
        <span className="h-1 w-1 rotate-45 bg-gold/80" aria-hidden />
      </div>
      <div className="flex h-full" aria-hidden>
        {[Minus, Square, X].map((Icon, i) => (
          <span
            key={i}
            className={cn(
              "flex h-full w-11 items-center justify-center transition-colors hover:bg-accent",
              i === 2 && "hover:bg-destructive hover:text-destructive-foreground",
            )}
          >
            <Icon className={i === 1 ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={1.5} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ open }: { open: boolean }) {
  const threads = useThreads();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const { toggleSidebar, openSettings } = useShell();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const saveRename = (id: string) => {
    chatStore.rename(id, draft);
    setEditing(null);
  };

  if (!open) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-3">
        <IconBtn label="Open sidebar" onClick={toggleSidebar}>
          <PanelLeft className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="New chat" onClick={() => navigate({ to: "/" })}>
          <Plus className="h-4 w-4" />
        </IconBtn>
        <div className="flex-1" />
        <IconBtn label="Settings" onClick={openSettings}>
          <Settings2 className="h-4 w-4" />
        </IconBtn>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <DarlynAvatar size={28} />
          <span className="text-[15px] font-semibold tracking-tight">Darlyn</span>
        </div>
        <IconBtn label="Collapse sidebar" onClick={toggleSidebar}>
          <PanelLeft className="h-4 w-4" />
        </IconBtn>
      </div>
      <div className="px-3">
        <Link
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Chat
        </Link>
      </div>
      <div className="mt-5 px-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Chats
      </div>
      <nav className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {threads.length === 0 && (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground">
            Your conversations will appear here.
          </p>
        )}
        {threads.map((t) => {
          const active = t.id === params.threadId;
          return (
            <div
              key={t.id}
              className={cn(
                "group relative flex items-center gap-1 rounded-lg pr-1 text-sm transition-colors duration-200",
                active
                  ? "bg-sidebar-accent before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60",
              )}
            >
              {editing === t.id ? (
                <form
                  className="flex flex-1 items-center gap-1 py-1 pl-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename(t.id);
                  }}
                >
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => saveRename(t.id)}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                    className="min-w-0 flex-1 rounded-md bg-background px-2 py-1 text-sm outline-none ring-1 ring-ring"
                  />
                  <button type="submit" className="p-1 text-muted-foreground" aria-label="Save">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className="min-w-0 flex-1 truncate px-2.5 py-2"
                  >
                    {t.title}
                  </Link>
                  <button
                    aria-label="Rename chat"
                    onClick={() => {
                      setDraft(t.title);
                      setEditing(t.id);
                    }}
                    className="rounded p-1 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Delete chat"
                    onClick={() => {
                      chatStore.remove(t.id);
                      if (active) navigate({ to: "/" });
                    }}
                    className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={openSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" /> Settings
        </button>
      </div>
    </aside>
  );
}

export function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}
