# Darlyn — Desktop Chat Prototype

## Review: what's strong
- Clear priority (chat first) and explicit "don'ts" stop feature creep.
- Honest-UI rules (no fake online status, session-only list, settings marked as placeholders) are excellent for trust.
- Prototype-only scope (no backend, mock replies) fits Lovable perfectly and keeps it cheap.

## Suggested tweaks (applied in this plan)
1. **Window chrome**: add a thin fake Windows title bar (app name + minimise/maximise/close glyphs) so it reads as a desktop app in the browser, not a website.
2. **Avatar**: one shared avatar slot used everywhere (sidebar, header, bubbles, welcome screen). It shows a simple lavender "D" placeholder until you upload your image, then I swap in your image in that one place.
3. **"Thinking" indicator**: show a typing-dots bubble only while the mock reply is pending — matches your "no fake activity" rule.
4. **Saved chat list**: past chats stay in the sidebar after closing and reopening the app (saved in this browser for the prototype). Each chat gets its own link, a title from its first message, and options to rename and delete. The saved-chat format is kept simple so a memory feature can use it later.
5. **Connection status**: show "Offline (prototype)" rather than a green dot, so it never pretends a model is running.
6. **Flutter handoff**: keep all colours, spacing and radii as named tokens, so they map 1:1 to a Flutter theme later.
7. **Small risk**: "phone-inspired" plus a 240px sidebar can drift toward Slack/Discord. Keep the chat column capped (~720px) with bubble styling closer to iMessage/WhatsApp.

## What gets built
- One screen at `/`: title bar, collapsible sidebar, chat header, message list, composer.
- First-launch empty state with greeting and 3 suggestion chips (clicking sends the message).
- Demo conversation loaded via a "New Chat" flow; mock replies after ~1.2s with typing dots.
- Enter sends, Shift+Enter new line, send button disabled when empty or waiting.
- Settings dialog: Theme (Dark/Light/System), Spacing (Compact/Comfortable), Model placeholder, Connection status.
- Sidebar auto-collapses under ~900px wide; no horizontal scrolling.

## Visual direction
- Dark default: deep charcoal background, muted plum surfaces, soft lavender accent, warm off-white text.
- Light theme: warm paper background, same lavender accent.
- Fonts: a friendly rounded sans for UI (e.g. Figtree or Manrope), no Inter.

## Technical details
- React + TypeScript + Tailwind, no Lovable Cloud.
- Chat list (threads) saved in localStorage as `{ id, title, createdAt, updatedAt, messages: [{ id, role, content, createdAt }] }`. The storage sits behind a small `chatStore` interface so it can later be swapped for Flutter/SQLite or a memory service.
- Routes: `/` shows the welcome screen; the first message creates a thread and navigates to `/chat/$threadId`. Reloading restores that thread. Startup avoids creating duplicate blank threads.
- Avatar: `DarlynAvatar` component with an optional image source and a monogram fallback.
- Components: `TitleBar`, `Sidebar`, `ChatHeader`, `MessageList`, `MessageBubble`, `TypingIndicator`, `Composer`, `EmptyState`, `SettingsDialog`, `DarlynMark`.
- Theme tokens in `src/styles.css` (oklch), `.dark` class toggled on `<html>`; System follows `prefers-color-scheme`.
- Mock reply generator picks from a small set of warm canned responses.
- Route head metadata updated for Darlyn.

## Flutter conversion manual (written after the build)
A `FLUTTER_CONVERSION.md` guide in the project root, covering:
- A map from each React component to a Flutter widget (e.g. Sidebar to `NavigationRail`/`Drawer`, MessageList to `ListView.builder` with `reverse: true`, Composer to a multiline `TextField` with Enter/Shift+Enter handling through `Shortcuts`/`Focus`).
- Design tokens converted to `ThemeData`/`ColorScheme` (oklch values given as hex) for dark and light themes, plus spacing and radius constants.
- State: React state and `chatStore` mapped to Riverpod/Provider, and saved chats in localStorage mapped to SQLite (`drift`/`sqflite`) or Hive, using the same thread/message data format. Notes on a future memory feature.
- Routing: `/chat/$threadId` mapped to `go_router`.
- Desktop window: `window_manager` and `bitsdojo_window` for the custom title bar, minimum window size and auto-collapsing sidebar.
- Ollama: swapping the mock reply generator for streaming calls to `http://localhost:11434/api/chat`, a connection check for the status indicator, and model listing via `/api/tags` for Settings.
- Avatar image as a Flutter asset, a suggested folder structure and a step-by-step conversion checklist.
