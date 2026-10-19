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
- Game simulation rules (probabilities, milestones, stats) live in `src/lib/toast-sim.ts`, kept pure so they're unit-testable; rendering is a single canvas loop in `src/components/toast/ToastGame.tsx` for performance with hundreds of falling toasts.
