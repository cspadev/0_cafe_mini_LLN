import type { Texts } from "./cs";
import { TOAST_CONFIG as C } from "@/lib/toast-config";

const share = (total: number) => (total === 3 ? "⅓" : `1/${total}`);

export const en: Texts = {
  htmlLang: "en",
  locale: "en-GB",
  meta: {
    title: "Murphy's Toast Lab — Law of Large Numbers Game",
    description: "Drop jam and ham toast off a school balcony and watch running averages converge: a hands-on Law of Large Numbers lesson.",
    ogTitle: "Murphy's Toast Lab",
    ogDescription: "Drop toast, splat the courtyard, and discover the Law of Large Numbers.",
  },
  kinds: { jam: "Jam", ham: "Ham" },
  header: {
    title: "MURPHY'S TOAST LAB",
    controls: "Game controls",
    scoreLabel: "Round score",
    score: (round, total, score) => `R${round}/${total} · ${score}%`,
    labReport: "Guess / lab report",
    mute: "Mute sounds",
    unmute: "Enable sounds",
    hose: "Hose down courtyard",
    newExperiment: "New experiment",
  },
  banners: {
    settle: "LET THE TOAST SETTLE…",
    labReport: "LAB REPORT",
    chefBonus: (n) => `+${n} TOASTS IN STOCK!`,
    truckBonus: (n) => `+${n} BULK BREAD DROP!`,
  },
  bubbles: {
    student: ["EWW!", "MY HOODIE!", "WHO DID THAT?!", "Not again…", "Murphy!!", "IN MY HAIR?"],
    chef: ["MON DIEU!", "MY TRAY!", "AAARGH!", "SACRÉ TOAST!"],
    truck: "HONK!! CARGO DOOR!",
  },
  stock: {
    label: "Toast stock",
    count: (n) => `STOCK: ${n}`,
    jam: "JAM TOAST",
    ham: "HAM TOAST",
    empty: "OUT OF TOAST!",
  },
  footer: {
    label: "Live experiment averages",
    toppingDown: "TOPPING-DOWN",
    toastAlt: (kind) => `${kind} toast`,
  },
  chart: {
    label: "Running average of topping-down landings",
    wildZone: (n) => `wild zone N<${n}`,
    axis: "N (log)",
  },
  intro: {
    dialog: "Before you start",
    kicker: "TODAY'S EXPERIMENT",
    title: "Two laws walk into a courtyard…",
    lead: <>Only one of them can be trusted. Let's test both — with science, a balcony and a <i>lot</i> of toast.</>,
    mission: (
      <>
        <b>Your mission:</b> {C.rounds.count} rounds, {C.rounds.count} chances to spot the unluckier topping. Each round starts with {C.stock.initial} toasts and new secret odds just {C.rounds.gapPoints[0]}–{C.rounds.gapPoints[1]} percentage points apart. Students return {C.stock.studentHit} toast per hit; the chef adds {C.bonuses.chef}. The truck unleashes a {C.bonuses.truck}-toast armageddon! A correct final guess earns {share(C.rounds.count)} of your score; a wrong guess loses the round. At early checkpoints, guess now or collect more data. Out of toast? Guess, or answer a three-question lab test: {C.revive.minCorrect} correct answer earns {C.stock.initial} more toasts, no penalty. Fewer correct loses the round.
      </>
    ),
    start: "START THE EXPERIMENT",
  },
  lab: {
    dialogReport: "Round lab report",
    dialogTest: "Revive lab test",
    kicker: (round, total, n) => `ROUND ${round} / ${total} · N = ${n}`,
    titleTest: "Earn your next loaf",
    titleEmpty: "Out of toast. Ready to call it?",
    titleDecide: "Guess now… or trust more toast?",
    early: "A few lucky drops can fool you. This is deliberately early — more observations may change the picture.",
    later: "More observations usually make the averages steadier, but a small difference can still be hard to spot.",
    question: "Which topping has the higher true chance of landing face-down?",
    rules: (total) => `A correct final guess earns ${share(total)} of your score. A wrong one ends this round with no points.`,
    lock: "Lock final guess",
    takeTest: (n) => `Take lab test for +${n} toasts`,
    keepPlaying: "Keep playing — collect more data",
    testIntro: (n, min) => `Answer all three. At least ${min} correct answer earns ${n} more toasts, with no score penalty. Otherwise this round is lost.`,
    check: "Check lab answers",
    back: "Back to final guess",
    correct: "✓ Correct. ",
    wrong: "✗ Not quite. ",
    testResult: (correct, count, passed) => `${correct}/${count} correct — ${passed ? "fresh toast approved!" : "this round is lost."}`,
    revive: (n) => `Revive with ${n} toasts`,
    seeResult: "See round result",
    questions: [
      { question: "Which sample usually gives a more stable running average?", options: ["10 drops", "500 drops", "They are always equally stable"], explanation: "Larger samples usually give more stable averages." },
      { question: "Jam is ahead after just 10 drops. What can you conclude?", options: ["Jam definitely has higher true odds", "Ham must catch up on the next drop", "The sample may be too small to decide"], explanation: "A small sample can be misleading; neither topping owes you a catch-up." },
      { question: "As more drops land, the running average tends towards…", options: ["The topping’s true probability", "Exactly 50%, regardless of the odds", "100%, because Murphy says so"], explanation: "The Law of Large Numbers points to the true probability, not necessarily 50%." },
    ],
  },
  result: {
    dialog: "Round result",
    kicker: (round, total) => `ROUND ${round} / ${total}`,
    titleCorrect: "Right topping. Nice science!",
    titleLost: "This round is lost.",
    testFailed: "Not enough lab answers were correct.",
    guessed: (kind) => `You guessed ${kind}.`,
    trueOdds: (jam, ham, n) => `True odds: Jam ${jam} · Ham ${ham}, after ${n} observations.`,
    gainCorrect: (total) => `+${share(total)} of the total score`,
    gainNone: "+0 points",
    score: (score) => `Score: ${score}%`,
    seeFinal: "See final evaluation",
    nextRound: (n) => `Start round ${n}`,
  },
  debrief: {
    dialog: "Experiment evaluation",
    kicker: (n) => `EXPERIMENT EVALUATION · N = ${n}`,
    titleTop: "Certified Toast Scientist!",
    titleMid: "Promising Crumb Researcher",
    titleLow: "Murphy got you this time…",
    summary: (score, correct, total) => `Final score: ${score}% · ${correct}/${total} correct rounds · No revive penalties.`,
    round: (n) => `Round ${n}:`,
    roundCorrect: (total) => `✓ Correct guess · +${share(total)}`,
    roundTestFailed: "✗ Revival test failed · +0",
    roundWrong: "✗ Wrong guess · +0",
    roundOdds: (n, jam, ham) => `N=${n} · True Jam ${jam} / Ham ${ham}`,
    explanation: (
      <>
        <b>What happened?</b> At first the lines jumped all over the place — a few lucky bounces could make either topping look cursed. As N grew, each new toast moved the average less and the lines <b>converged</b> towards the true probabilities. That's the Law of Large Numbers: you need <b>enough observations</b> before you can decide with reasonable certainty. And Murphy? Toast doesn't <i>always</i> land topping-down — it just happens often enough to feel personal.
      </>
    ),
    outroTitle: "But wait — is real toast cursed?",
    newExperiment: "NEW EXPERIMENT (NEW SECRET ODDS)",
    finish: "CONTINUE",
  },
  comics: {
    intro: [
      {
        title: "LAW #1 · MURPHY'S LAW",
        bubble: "NOOOO! Not the jam side!",
        caption: <>“Anything that can go wrong, will go wrong.” Folk wisdom says dropped toast <b>always</b> lands topping-side down. The universe hates your breakfast.</>,
      },
      {
        title: "LAW #2 · THE LAW OF LARGE NUMBERS",
        bubble: "One toast tells me nothing. A thousand tell me the truth.",
        caption: <>One drop is pure luck. But the more times you repeat a random event, the closer the <b>average</b> gets to the true probability. Small samples lie; big samples confess.</>,
      },
    ],
    outro: [
      {
        title: "1995 · THE TUMBLING TOAST",
        bubble: "It's not the butter. It's the table!",
        caption: <>British physicist <b>Robert Matthews</b> published “Tumbling toast, Murphy's Law and the fundamental constants”. Toast sliding off table height only has time for about <b>half a rotation</b> — so it lands butter-side down roughly <b>60%</b> of the time.</>,
      },
      {
        title: "1996 · THE IG NOBEL PRIZE",
        bubble: "Blame the height of humans, not the butter!",
        caption: <>He won the <b>Ig Nobel Prize for Physics</b> — the parody award for research that “makes people laugh, then think”. Tables are as tall as they are because humans are as tall as they are… which depends on the fundamental constants of physics!</>,
      },
    ],
  },
  errors: {
    notFoundTitle: "Page not found",
    notFoundText: "The page you're looking for doesn't exist or has been moved.",
    home: "Go home",
    loadTitle: "This page didn't load",
    loadText: "Something went wrong on our end. You can try refreshing or head back home.",
    retry: "Try again",
  },
};
