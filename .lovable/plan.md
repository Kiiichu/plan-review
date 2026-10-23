# Darlyn — Desktop Chat Prototype

## Review: what's strong
- Clear priority (chat first) and explicit "don'ts" stop feature creep.
- Honest-UI rules (no fake online status, session-only list, settings marked as placeholders) are excellent for trust.
- Prototype-only scope (no backend, mock replies) fits Lovable perfectly and keeps it cheap.

## Suggested tweaks (applied in this plan)
1. **Window chrome**: add a thin fake Windows title bar (app name + minimise/maximise/close glyphs) so it reads as a desktop app in the browser, not a website.
2. **Avatar**: a simple abstract emblem (soft crescent/"D" monogram in lavender), built in code so it scales and is easy to recreate in Flutter.
3. **"Thinking" indicator**: show a typing-dots bubble only while the mock reply is pending — matches your "no fake activity" rule.
4. **Session list**: start a new entry in the sidebar when "New Chat" is used, labelled "This session" so nothing implies it survives a restart.
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
- React + TypeScript + Tailwind, local state only, no Lovable Cloud.
- Components: `TitleBar`, `Sidebar`, `ChatHeader`, `MessageList`, `MessageBubble`, `TypingIndicator`, `Composer`, `EmptyState`, `SettingsDialog`, `DarlynMark`.
- Theme tokens in `src/styles.css` (oklch), `.dark` class toggled on `<html>`; System follows `prefers-color-scheme`.
- Mock reply generator picks from a small set of warm canned responses.
- Route head metadata updated for Darlyn.
