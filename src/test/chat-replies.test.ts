import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatStore } from "@/lib/chat-store";

describe("mock replies", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("answers the 'something on my mind' starter with its own opening reply", () => {
    const id = chatStore.createThread("There's something on my mind.");
    vi.advanceTimersByTime(3000);
    const msgs = chatStore.get(id)!.messages;
    expect(msgs[1]!.content).toBe("I'm listening. Take your time — what's been sitting with you?");
  });

  it("never repeats Darlyn's previous reply back-to-back", () => {
    const id = chatStore.createThread("hello");
    for (let i = 0; i < 30; i++) {
      vi.advanceTimersByTime(3000);
      chatStore.send(id, `message ${i}`);
    }
    vi.advanceTimersByTime(3000);
    const replies = chatStore.get(id)!.messages.filter((m) => m.role === "darlyn").map((m) => m.content);
    expect(replies.length).toBe(31);
    for (let i = 1; i < replies.length; i++) expect(replies[i]).not.toBe(replies[i - 1]);
  });
});
