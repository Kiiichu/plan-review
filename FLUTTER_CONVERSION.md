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
| `DarlynAvatar` | `CircleAvatar(backgroundImage: AssetImage("assets/avatar.jpg"))` (prototype uses the uploaded ARIA.jpg, center-cropped) with a monogram fallback (`CustomPaint`) |

---

## 3. Design tokens (from `src/styles.css`)

The prototype now uses these exact hex values.

### Dark (default) — "city at dusk"
| Token | Hex |
|---|---|
| background | `#12151D` |
| titlebar | `#0B0D13` |
| panel / sidebar | `#0E1118` |
| card / chat surface / Darlyn bubble | `#1B202B` |
| elevated (composer, secondary) | `#252C39` |
| foreground (ivory) | `#F1EEE8` |
| muted-foreground | `#A7B0BE` |
| primary (sky blue) / ring | `#A9C8E8` |
| primary-foreground | `#12151D` |
| secondary accent | `#7899BD` |
| gold (decorative only) | `#D8BE91` |
| lavender (typing dots only) | `#B6A5D7` |
| border | `#303746` |
| bubble-user | `#2E4566` (text `#F1EEE8`) |
| destructive | `#E07A6C` |

Main chat area has a faint top radial glow (`#7899BD` at 10% opacity). Gold is used only for the small diamond in the title bar and the divider on the welcome screen. Active chat in the sidebar shows a 2px sky-blue bar on its left.

### Light
| Token | Hex |
|---|---|
| background | `#F4F1EA` |
| card / bubble-darlyn | `#FBF9F5` |
| foreground | `#1B202B` |
| muted-foreground | `#5B6576` |
| primary / bubble-user | `#3F6A99` |
| gold | `#A9844A` |
| lavender | `#8A78B3` |
| border | `#DCD8D0` |

### Shape and spacing
- Base radius 14px; bubbles 24px (tail corner 6px); composer 24px; chips fully rounded.
- Chat column max width 720px; horizontal padding 20px.
- Message gap 8px (comfortable) / 4px (compact); 16px / 8px between role groups.
- Font: Figtree (`GoogleFonts.figtreeTextTheme()`), message text 15px with 1.6 line height.

```dart
// theme/tokens.dart (excerpt)
class DarlynColors {
  static const darkBg = Color(0xFF12151D);
  static const darkPrimary = Color(0xFFA9C8E8);
  static const darkGold = Color(0xFFD8BE91);
  static const darkBubbleUser = Color(0xFF2E4566);
  static const darkBubbleDarlyn = Color(0xFF1B202B);
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
