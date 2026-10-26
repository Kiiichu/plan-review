import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  update,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: Settings;
  update: (p: Partial<Settings>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Prototype preview — Darlyn isn't connected to a model yet.</DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border">
          <Row label="Theme">
            <Segmented
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
              ]}
            />
          </Row>
          <Row label="Chat spacing">
            <Segmented
              value={settings.spacing}
              onChange={(spacing) => update({ spacing })}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Row>
          <Row label="Model" hint="Prototype placeholder — no model connected">
            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
              Not configured
            </span>
          </Row>
          <Row label="Local AI service" hint="Prototype placeholder — replies are simulated">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
              Offline (prototype)
            </span>
          </Row>
        </div>
      </DialogContent>
    </Dialog>
  );
}
