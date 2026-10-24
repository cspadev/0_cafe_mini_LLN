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
- Stop normal launches and drain existing flights and bursts before automatic milestone, requested or empty-stock decisions; every scored round uses this same settled decision path.
- Synthesise browser-only audio in `src/lib/toast-audio.ts` and unlock it on user gestures; sound stays optional and requires no external service.
- Keep tunable bonuses, actor sizes/roster, truck visit timing/path and sound levels in `src/lib/toast-config.ts`; simulation and rendering consume this shared config to avoid divergent rules.
- Model truck visits as a pure offscreen-wait/enter/park/reverse-exit state machine in the simulation, with one reward per visit so repeated hits cannot multiply a single delivery.
- Define student walking lanes in courtyard-image coordinates and project through the centered cover crop for both drawing and hit detection so walkers stay on paving at any aspect ratio.
- Keep finite supply, round scoring, secret odds and three-question revival evaluation as pure simulation helpers with shared config; each new round resets the scene and supply while preserving completed round results.
