import { useSyncExternalStore } from "react";

/** Data format kept simple so a future memory feature / Flutter SQLite can reuse it. */
export type Role = "user" | "darlyn";
export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}
export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const KEY = "darlyn.threads.v1";
const EMPTY: ChatThread[] = [];
let threads: ChatThread[] | null = null;
const pending = new Set<string>();
let pendingVersion = 0;
const listeners = new Set<() => void>();

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function load(): ChatThread[] {
  if (threads) return threads;
  if (typeof window === "undefined") return EMPTY;
  try {
    threads = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    threads = [];
  }
  return threads!;
}

function commit(next: ChatThread[]) {
  threads = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / unavailable */
  }
  emit();
}
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function makeTitle(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 40).trimEnd() + "…" : t || "New chat";
}

const REPLIES = [
  "I like that. Tell me a little more — what made you think of it?",
  "Honestly? That sounds like a lot to carry. Want to untangle it one piece at a time?",
  "Okay, fun fact: octopuses have three hearts, and two of them stop beating when they swim. Dramatic little creatures.",
  "Ha, fair. I'm here — no rush. What's the best part of your day so far?",
  "Let's think it through. What would the version of you a year from now want you to do?",
  "That makes sense. What's the part you keep coming back to?",
];

/** Opening replies for the welcome-screen starters, so each begins its own mock conversation. */
const STARTER_REPLIES: Record<string, string> = {
  "Keep me company for a bit.":
    "Of course — I'm right here. We can talk about anything, or nothing much at all. How's your day been so far?",
  "There's something on my mind.":
    "I'm listening. Take your time — what's been sitting with you?",
  "Surprise me with something interesting.":
    "Okay, here's one: octopuses have three hearts, and two of them stop beating when they swim. Dramatic little creatures. Want another?",
};

function pickReply(thread: ChatThread | undefined, userText: string): string {
  const darlynMsgs = thread?.messages.filter((m) => m.role === "darlyn") ?? [];
  const starter = STARTER_REPLIES[userText];
  if (darlynMsgs.length === 0 && starter) return starter;
  const last = darlynMsgs.at(-1)?.content;
  const options = REPLIES.filter((r) => r !== last);
  return options[Math.floor(Math.random() * options.length)] ?? REPLIES[0]!;
}

export const chatStore = {
  /** Creates a thread with the first user message and starts the (mock) reply. */
  createThread(firstMessage: string): string {
    const now = Date.now();
    const t: ChatThread = {
      id: uid(),
      title: makeTitle(firstMessage),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    commit([t, ...load()]);
    chatStore.send(t.id, firstMessage);
    return t.id;
  },
  get(id: string) {
    return load().find((t) => t.id === id);
  },
  send(threadId: string, text: string) {
    const content = text.trim();
    if (!content || pending.has(threadId)) return;
    const reply = pickReply(chatStore.get(threadId), content);
    append(threadId, { id: uid(), role: "user", content, createdAt: Date.now() });
    pending.add(threadId);
    pendingVersion++;
    emit();
    // Mock reply — replace with Ollama streaming in production.
    setTimeout(() => {
      append(threadId, {
        id: uid(),
        role: "darlyn",
        content: reply,
        createdAt: Date.now(),
      });
      pending.delete(threadId);
      pendingVersion++;
      emit();
    }, 1200 + Math.random() * 800);
  },
  rename(id: string, title: string) {
    commit(load().map((t) => (t.id === id ? { ...t, title: title.trim() || t.title } : t)));
  },
  remove(id: string) {
    commit(load().filter((t) => t.id !== id));
  },
  isPending(id: string) {
    return pending.has(id);
  },
};

function append(threadId: string, m: ChatMessage) {
  commit(
    load()
      .map((t) =>
        t.id === threadId ? { ...t, messages: [...t.messages, m], updatedAt: m.createdAt } : t,
      )
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

export function useThreads(): ChatThread[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}
export function usePending(id: string | undefined): boolean {
  useSyncExternalStore(
    subscribe,
    () => pendingVersion,
    () => 0,
  );
  return !!id && pending.has(id);
}
