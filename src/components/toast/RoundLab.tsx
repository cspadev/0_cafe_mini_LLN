import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConvergenceChart } from "./ConvergenceChart";
import { REVIVE_QUESTIONS, evaluateReviveTest, type Kind, type Stats } from "@/lib/toast-sim";

export function RoundLab({ stats, round, empty, onContinue, onGuess, onTest }: { stats: Stats; round: number; empty: boolean; onContinue: () => void; onGuess: (kind: Kind) => void; onTest: (answers: number[]) => void }) {
  const [testing, setTesting] = useState(false);
  const [guess, setGuess] = useState<Kind | null>(null);
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1]);
  const [submitted, setSubmitted] = useState(false);
  const result = evaluateReviveTest(answers);
  const n = stats.jam.n + stats.ham.n;
  return <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/50 p-4">
    <section role="dialog" aria-modal="true" aria-label={testing ? "Revive lab test" : "Round lab report"} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto border-4 border-ink bg-paper p-5 shadow-cut">
      <p className="font-display text-sm text-jam">ROUND {round} / 3 · N = {n}</p>
      <h2 className="font-display mt-2 text-2xl">{testing ? "Earn your next loaf" : empty ? "Out of toast. Ready to call it?" : "Guess now… or trust more toast?"}</h2>
      {!testing ? <>
        <ConvergenceChart stats={stats} />
        <p className="mt-2 text-sm">{n < 50 ? "A few lucky drops can fool you. This is deliberately early — more observations may change the picture." : "More observations usually make the averages steadier, but a small difference can still be hard to spot."}</p>
        <p className="mt-3 text-sm font-bold">Which topping has the higher true chance of landing face-down?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">{(["jam", "ham"] as const).map(kind => <Button key={kind} variant="outline" aria-pressed={guess === kind} className={guess === kind ? "bg-ink text-paper hover:bg-ink/90" : ""} onClick={() => setGuess(kind)}>{kind === "jam" ? "Jam" : "Ham"}</Button>)}</div>
        <p className="mt-2 text-xs text-ink/70">A correct final guess earns ⅓ of your score. A wrong one ends this round with no points.</p>
        <Button disabled={guess === null || n === 0} className="mt-4 w-full bg-jam text-paper hover:bg-jam/90" onClick={() => { if (guess) onGuess(guess); }}>Lock final guess</Button>
        {empty ? <Button variant="outline" className="mt-2 w-full" onClick={() => setTesting(true)}>Take lab test for +30 toasts</Button> : <Button variant="outline" className="mt-2 w-full" onClick={onContinue}>Keep playing — collect more data</Button>}
      </> : <>
        <p className="mt-2 text-sm">Answer all three. At least one correct answer earns 30 more toasts, with no score penalty. Zero correct loses this round.</p>
        {REVIVE_QUESTIONS.map((q, i) => <fieldset key={q.question} className="mt-4" disabled={submitted}>
          <legend className="text-sm font-bold">{i + 1}. {q.question}</legend>
          <div className="mt-2 grid gap-2">{q.options.map((option, index) => <Button key={option} variant="outline" aria-pressed={answers[i] === index} className={`h-auto min-h-9 whitespace-normal justify-start text-left ${answers[i] === index ? "bg-ink text-paper hover:bg-ink/90" : ""}`} onClick={() => setAnswers(old => old.map((v, j) => j === i ? index : v))}>{option}</Button>)}</div>
          {submitted && <p className="mt-2 text-xs">{answers[i] === q.correct ? "✓ Correct. " : "✗ Not quite. "}{q.explanation}</p>}
        </fieldset>)}
        {!submitted ? <><Button disabled={!result.complete} className="mt-4 w-full bg-jam text-paper hover:bg-jam/90" onClick={() => setSubmitted(true)}>Check lab answers</Button><Button variant="ghost" className="mt-2 w-full" onClick={() => setTesting(false)}>Back to final guess</Button></> : <><p role="status" className="mt-4 font-bold">{result.correct}/3 correct — {result.passed ? "fresh toast approved!" : "this round is lost."}</p><Button className="mt-3 w-full bg-jam text-paper hover:bg-jam/90" onClick={() => onTest(answers)}>{result.passed ? "Revive with 30 toasts" : "See round result"}</Button></>}
      </>}
    </section>
  </div>;
}