# The Great Toast Drop

Create an interactive educational game for high schoolers demonstrating the Law of Large Numbers through the Murphy's Law toast problem.

Core mechanics & experience:
- First-person POV looking down from a 2nd-floor school balcony onto a bustling courtyard. In the foreground, the player's hand holds a slice of toast over the railing.
- Two toast types appear randomly in hand: Toast with Jam and Toast with Ham, each with secret unannounced probabilities of landing topping-side down (e.g., Jam at ~53%, Ham at ~68%).
- Throwing controls: Click to throw a single toast, or hold down the throw button to continuously launch toasts at a steady rate until released.
- Targets in the courtyard: Students, a cafeteria chef carrying a tray (hitting him triggers a +20 toast barrage bonus), and a bread delivery truck (+300 bulk drop bonus).
- Dynamic visual feedback: Toasts tumble in 3D perspective down to the ground, leaving humorous splats (red jam splats or crumb bounces) on the pavement, with character reactions.
- Live Real-Time Statistics & Convergence Chart:
  - Visible from the very first drop, plotting running averages for both Jam Toast and Ham Toast as N increases.
  - Highlights initial high volatility (wild swings at N < 20) smoothly stabilizing into flat convergence lines as N grows into hundreds and thousands.
- Inquiry Milestones: Prompts appear at milestones (e.g., N=10, N=25, N=50, N=100) asking students to hypothesize which topping has a higher probability and whether the gap is widening or narrowing.
- High-energy, humorous aesthetic inspired by tactile photo-cutout comedy (using the provided reference artwork for the hand, toasts, chef, truck, and courtyard).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c753a89-ebdd-46c9-beb2-fe528e2f5b8b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
