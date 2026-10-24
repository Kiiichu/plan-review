<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Lovable app is a UI prototype only; production is Flutter + Ollama, so keep logic simple and mirror changes in FLUTTER_CONVERSION.md.
- All chat persistence goes through `src/lib/chat-store.ts` (localStorage for now) so storage can be swapped without touching UI.
- Darlyn's avatar is rendered only via `DarlynAvatar`, so the image is swapped in one place.
