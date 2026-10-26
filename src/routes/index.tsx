import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChatHeader, Composer } from "@/components/darlyn/Chat";
import { DarlynAvatar } from "@/components/darlyn/DarlynAvatar";
import { chatStore } from "@/lib/chat-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Darlyn — your everyday companion" },
      { name: "description", content: "Darlyn is a warm, personal AI companion chat for your desktop." },
      { property: "og:title", content: "Darlyn — your everyday companion" },
      { property: "og:description", content: "A little company for your everyday moments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const SUGGESTIONS = [
  "Keep me company for a bit.",
  "There's something on my mind.",
  "Surprise me with something interesting.",
];

function Welcome() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const start = (msg: string) => {
    const id = chatStore.createThread(msg);
    navigate({ to: "/chat/$threadId", params: { threadId: id } });
  };

  return (
    <>
      <ChatHeader />
      {/* my-auto (not justify-center) so short windows scroll instead of clipping the top */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="my-auto flex flex-col items-center text-center">
          <DarlynAvatar size={72} />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Hey, I'm Darlyn.</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">A little company for your everyday moments.</p>
          <p className="mt-8 text-sm text-muted-foreground">What's on your mind?</p>
          <div className="mt-3 flex max-w-xl flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => start(s)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-ring/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Composer onSend={start} value={text} onValueChange={setText} />
    </>
  );
}
