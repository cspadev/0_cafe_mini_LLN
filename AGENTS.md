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
- Generate secret odds once per experiment and pass them into every roll; this preserves a stable probability for convergence while allowing replay variation.
- Gate lab notebooks and reports on an idle simulation, never on individual landings; bulk drops must finish before any pause.
- Synthesise browser-only audio in `src/lib/toast-audio.ts` and unlock it on user gestures; sound stays optional and requires no external service.
- Keep tunable bonuses, actor sizes/roster, truck visit timing/path and sound levels in `src/lib/toast-config.ts`; simulation and rendering consume this shared config to avoid divergent rules.
- Model truck visits as a pure offscreen-wait/enter/park/reverse-exit state machine in the simulation, with one reward per visit so repeated hits cannot multiply a single delivery.
