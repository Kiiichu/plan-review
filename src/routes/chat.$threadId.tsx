import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatHeader, Composer, MessageList } from "@/components/darlyn/Chat";
import { chatStore, usePending, useThreads } from "@/lib/chat-store";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat with Darlyn" },
      { name: "description", content: "A conversation with Darlyn, your desktop companion." },
      { property: "og:title", content: "Chat with Darlyn" },
      { property: "og:description", content: "A conversation with Darlyn, your desktop companion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const threads = useThreads();
  const pending = usePending(threadId);
  const hydrated = useHydrated();
  const thread = threads.find((t) => t.id === threadId);

  if (!hydrated) return <ChatHeader />;

  if (!thread) {
    return (
      <>
        <ChatHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          This chat isn't here anymore.
          <Link to="/" className="text-primary hover:underline">Start a new one</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ChatHeader />
      <MessageList key={threadId} messages={thread.messages} pending={pending} />
      <Composer key={`c-${threadId}`} disabled={pending} onSend={(t) => chatStore.send(threadId, t)} />
    </>
  );
}
