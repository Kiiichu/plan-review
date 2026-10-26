import { useEffect, useRef, useState } from "react";
import { ArrowUp, MoreHorizontal } from "lucide-react";
import { DarlynAvatar } from "./DarlynAvatar";
import { IconBtn, useShell } from "./AppShell";
import type { ChatMessage } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

export function ChatHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
      <div className="flex items-center gap-3">
        <DarlynAvatar size={38} />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">Darlyn</div>
          <div className="text-xs text-muted-foreground">Your companion</div>
        </div>
      </div>
      <IconBtn label="More options">
        <MoreHorizontal className="h-4 w-4" />
      </IconBtn>
    </header>
  );
}

const time = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function MessageList({ messages, pending }: { messages: ChatMessage[]; pending: boolean }) {
  const { settings } = useShell();
  const endRef = useRef<HTMLDivElement>(null);
  const compact = settings.spacing === "compact";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className={cn("mx-auto flex max-w-[720px] flex-col px-5 py-6", compact ? "gap-1" : "gap-2")}>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const firstOfGroup = !prev || prev.role !== m.role;
          const lastOfGroup = !next || next.role !== m.role;
          const mine = m.role === "user";
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-end gap-2",
                mine ? "justify-end" : "justify-start",
                firstOfGroup && i > 0 && (compact ? "mt-2" : "mt-4"),
              )}
            >
              {!mine && (
                <div className="w-7 shrink-0">{lastOfGroup && <DarlynAvatar size={28} />}</div>
              )}
              <div className={cn("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "whitespace-pre-wrap break-words rounded-3xl text-[15px] leading-relaxed",
                    compact ? "px-3.5 py-2" : "px-4 py-2.5",
                    mine
                      ? "bg-bubble-user text-bubble-user-foreground"
                      : "bg-bubble-darlyn text-bubble-darlyn-foreground ring-1 ring-border/60",
                    mine && lastOfGroup && "rounded-br-md",
                    !mine && lastOfGroup && "rounded-bl-md",
                  )}
                >
                  {m.content}
                </div>
                {lastOfGroup && (
                  <span className="mt-1 px-1 text-[11px] text-muted-foreground">{time(m.createdAt)}</span>
                )}
              </div>
            </div>
          );
        })}
        {pending && (
          <div className="mt-4 flex items-end gap-2" aria-label="Darlyn is replying">
            <DarlynAvatar size={28} />
            <div className="flex gap-1 rounded-3xl rounded-bl-md bg-bubble-darlyn px-4 py-3.5 ring-1 ring-border/60">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-lavender"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export function Composer({
  onSend,
  disabled,
  value,
  onValueChange,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  value?: string;
  onValueChange?: (v: string) => void;
}) {
  const [inner, setInner] = useState("");
  const text = value ?? inner;
  const setText = onValueChange ?? setInner;
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim().length > 0 && !disabled;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [text]);

  useEffect(() => {
    ref.current?.focus();
  }, [disabled]);

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="shrink-0 px-5 pb-5 pt-2">
      <div className="mx-auto flex max-w-[720px] items-end gap-2 rounded-3xl border border-border/60 bg-secondary p-2 pl-4 shadow-lg shadow-background/40 transition-[border-color,box-shadow] duration-200 focus-within:border-ring/45 focus-within:ring-4 focus-within:ring-ring/10">
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Darlyn..."
          className="max-h-[180px] min-h-[24px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity,transform,filter] duration-200 hover:brightness-110 active:scale-95 disabled:opacity-35 disabled:hover:brightness-100"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
