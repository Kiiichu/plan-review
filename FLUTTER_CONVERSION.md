# Darlyn: Converting the React Prototype to Flutter (Windows Desktop)

This guide maps the Lovable prototype (React + TypeScript + Tailwind) to a production Flutter Windows app connected to Ollama.

---

## 1. Suggested Flutter project structure

```text
lib/
  main.dart                  # window setup, ProviderScope, MaterialApp.router
  app/router.dart            # go_router: "/" and "/chat/:threadId"
  theme/
    tokens.dart              # colors, radii, spacing (from src/styles.css)
    app_theme.dart           # ThemeData light + dark
  data/
    models.dart              # ChatThread, ChatMessage (same fields as chat-store.ts)
    chat_repository.dart     # SQLite persistence (replaces localStorage)
    ollama_client.dart       # replaces the mock reply generator
  state/
    threads_provider.dart    # Riverpod (replaces useThreads / chatStore)
    settings_provider.dart   # replaces lib/settings.ts
  ui/
    shell/app_shell.dart     # AppShell.tsx
    shell/title_bar.dart     # TitleBar
    shell/sidebar.dart       # Sidebar
    chat/chat_header.dart
    chat/message_list.dart
    chat/message_bubble.dart
    chat/typing_indicator.dart
    chat/composer.dart
    welcome/welcome_page.dart  # routes/index.tsx
    chat/chat_page.dart        # routes/chat.$threadId.tsx
    settings/settings_dialog.dart
    common/darlyn_avatar.dart
assets/
  avatar.jpg
```

Packages (`pubspec.yaml`): `flutter_riverpod`, `go_router`, `window_manager`, `bitsdojo_window` (optional custom frame), `drift` + `sqlite3_flutter_libs` (or `sqflite_common_ffi`), `http`, `google_fonts`, `uuid`, `shared_preferences` (for settings).

---

## 2. Component to widget map

| React (prototype) | Flutter |
|---|---|
| `AppShell` | `Scaffold` + `Column(TitleBar, Expanded(Row(Sidebar, Expanded(child))))`; use `ShellRoute` in go_router |
| `TitleBar` | `WindowTitleBarBox` + `MoveWindow` (bitsdojo) or `DragToMoveArea` (window_manager), plus `MinimizeWindowButton` / `MaximizeWindowButton` / `CloseWindowButton` |
| `Sidebar` (240px / 56px collapsed) | `AnimatedContainer(width: open ? 240 : 56)`; auto-collapse with `LayoutBuilder` when width < 900 |
| Thread row (rename / delete) | `ListTile` inside `MouseRegion` (show actions on hover); rename uses inline `TextField` |
| `ChatHeader` | `Container(height: 64)` + `Row(DarlynAvatar, Column(name, "Your companion"), IconButton(more))` |
| `MessageList` | `ListView.builder(reverse: true)` inside `Center(ConstrainedBox(maxWidth: 720))` |
| Bubble | `Container` with `BorderRadius.only(...)`; tail corner = 6px, others = 24px; max width 78% via `FractionallySizedBox`/`ConstrainedBox` |
| Message grouping | Same logic: group consecutive messages by role; avatar + timestamp only on last of group |
| `TypingIndicator` | Three dots with a staggered `AnimationController` (1.2s loop, 0.15s offset) |
| `Composer` | `TextField(minLines: 1, maxLines: 6)` in rounded `DecoratedBox`; send `IconButton.filled` |
| Enter / Shift+Enter | Wrap in `Focus(onKeyEvent:)`: if `LogicalKeyboardKey.enter` and not `HardwareKeyboard.instance.isShiftPressed` then send and return `KeyEventResult.handled` |
| Welcome screen + chips | `SingleChildScrollView` + `ConstrainedBox(minHeight: viewport)` + centered `Column` (so short windows scroll instead of clipping); chips = `ActionChip` / `OutlinedButton` with `StadiumBorder`. Starters: "Keep me company for a bit.", "There's something on my mind.", "Surprise me with something interesting." |
| Composer focus | Subtle: border at ~50% accent plus a faint 4px accent glow (`BoxShadow`, ~10% opacity) — no hard outline |
| Mock replies | Each welcome starter gets its own opening reply (`STARTER_REPLIES` in chat-store); otherwise random, never repeating Darlyn's previous reply back-to-back |
| `SettingsDialog` | `showDialog` + `SegmentedButton` for Theme and Spacing |
| `DarlynAvatar` | `CircleAvatar(backgroundImage: AssetImage("assets/avatar.jpg"))` (prototype uses the uploaded ARIA.jpg, center-cropped)` with a monogram fallback (`CustomPaint`) |

---

## 3. Design tokens (from `src/styles.css`)

Approximate hex conversions of the oklch values. Verify them with an oklch converter if you need exact matches.

### Dark (default)
| Token | Hex |
|---|---|
| background | `#1E1A1E` |
| titlebar | `#161316` |
| panel / sidebar | `#191519` |
| card | `#272226` |
| foreground | `#EEEAE3` |
| muted-foreground | `#A39BA5` |
| primary (lavender) | `#C3AEE6` |
| primary-foreground | `#231B2E` |
| accent | `#3A2F3E` |
| border | `#3A3239` |
| bubble-user | `#5A4672` |
| bubble-user-fg | `#F2EEF8` |
| bubble-darlyn | `#2C262B` |
| destructive | `#E5786A` |

### Light
| Token | Hex |
|---|---|
| background | `#F8F5F0` |
| card | `#FDFBF8` |
| foreground | `#33282F` |
| muted-foreground | `#776B73` |
| primary / bubble-user | `#8C6BBF` |
| accent | `#E9E0EE` |
| border | `#DDD5DD` |
| bubble-darlyn | `#FDFBF8` |

### Shape and spacing
- Base radius 14px; bubbles 24px (tail corner 6px); composer 24px; chips fully rounded.
- Chat column max width 720px; horizontal padding 20px.
- Message gap 8px (comfortable) / 4px (compact); 16px / 8px between role groups.
- Font: Figtree (`GoogleFonts.figtreeTextTheme()`), message text 15px with 1.6 line height.

```dart
// theme/tokens.dart (excerpt)
class DarlynColors {
  static const darkBg = Color(0xFF1E1A1E);
  static const darkPrimary = Color(0xFFC3AEE6);
  static const darkBubbleUser = Color(0xFF5A4672);
  static const darkBubbleDarlyn = Color(0xFF2C262B);
}
// Expose bubble colors via a ThemeExtension<DarlynTheme>.
```

---

## 4. Data and state

The prototype format (`src/lib/chat-store.ts`) carries over directly:

```dart
class ChatMessage { String id; String role; /* 'user' | 'darlyn' */ String content; DateTime createdAt; }
class ChatThread { String id; String title; DateTime createdAt; DateTime updatedAt; List<ChatMessage> messages; }
```

SQLite schema:
```sql
CREATE TABLE threads (id TEXT PRIMARY KEY, title TEXT, created_at INTEGER, updated_at INTEGER);
CREATE TABLE messages (id TEXT PRIMARY KEY, thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE,
                       role TEXT, content TEXT, created_at INTEGER);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
```

`chatStore` methods map to a Riverpod `Notifier<List<ChatThread>>`:
`createThread`, `send`, `rename`, `remove`, `isPending` (keep a `Set<String>` of pending thread IDs in state).

To migrate prototype data, export localStorage key `darlyn.threads.v1` as JSON and import it on first launch.

### Future memory feature
- Add a `memories` table (`id, content, source_thread_id, created_at, embedding BLOB`).
- After each conversation, ask the model to summarise durable facts and store them.
- Before each reply, retrieve relevant memories (Ollama `/api/embed` and cosine similarity) and add them to the system prompt.

---

## 5. Ollama integration (replaces the mock reply)

```dart
final req = http.Request('POST', Uri.parse('http://localhost:11434/api/chat'))
  ..headers['Content-Type'] = 'application/json'
  ..body = jsonEncode({
    'model': selectedModel,
    'stream': true,
    'messages': [
      {'role': 'system', 'content': darlynSystemPrompt},
      ...thread.messages.map((m) => {
        'role': m.role == 'user' ? 'user' : 'assistant', 'content': m.content}),
    ],
  });
final res = await http.Client().send(req);
await for (final line in res.stream.transform(utf8.decoder).transform(const LineSplitter())) {
  final chunk = jsonDecode(line);
  appendToken(chunk['message']?['content'] ?? '');
  if (chunk['done'] == true) break;
}
```

- Connection status: `GET http://localhost:11434/api/version` every few seconds. Show "Connected" or "Offline".
- Model list for Settings: `GET /api/tags`.
- Show the typing indicator only between send and the first token, then stream text into the bubble.

---

## 6. Window setup

```dart
await windowManager.ensureInitialized();
await windowManager.waitUntilReadyToShow(const WindowOptions(
  size: Size(1200, 800), minimumSize: Size(560, 480),
  titleBarStyle: TitleBarStyle.hidden, title: 'Darlyn'), () async {
  await windowManager.show(); await windowManager.focus();
});
```

---

## 7. Conversion checklist

1. Create the Flutter project with Windows enabled (`flutter create --platforms=windows darlyn`).
2. Add the packages and assets (avatar, Figtree).
3. Port tokens and build light and dark `ThemeData`, plus `ThemeExtension` for bubbles.
4. Build `DarlynAvatar`, `TitleBar`, `Sidebar`, `AppShell` with `ShellRoute`.
5. Build `ChatHeader`, `MessageBubble`, `MessageList`, `TypingIndicator`, `Composer` (Enter/Shift+Enter).
6. Build the welcome page with suggestion chips and the settings dialog.
7. Implement `ChatRepository` (SQLite) and the Riverpod providers.
8. Port the mock replies first, then swap in `OllamaClient` streaming.
9. Add the connection indicator and model picker.
10. Test resizing: sidebar collapses under 900px, no clipping, composer stays visible.
11. Package with `flutter build windows` (optionally MSIX via `msix` package).
