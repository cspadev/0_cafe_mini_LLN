import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConvergenceChart } from "./ConvergenceChart";
import { evaluateReviveTest, type Kind, type Stats } from "@/lib/toast-sim";
import { TOAST_CONFIG } from "@/lib/toast-config";
import { t } from "@/i18n";

export function RoundLab({ stats, round, rounds, empty, onContinue, onGuess, onTest }: { stats: Stats; round: number; rounds: number; empty: boolean; onContinue: () => void; onGuess: (kind: Kind) => void; onTest: (answers: number[]) => void }) {
  const [testing, setTesting] = useState(false);
  const [guess, setGuess] = useState<Kind | null>(null);
  const [answers, setAnswers] = useState<number[]>(() => TOAST_CONFIG.revive.answerKey.map(() => -1));
  const [submitted, setSubmitted] = useState(false);
  const result = evaluateReviveTest(answers);
  const n = stats.jam.n + stats.ham.n;
  return <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/50 p-4">
    <section role="dialog" aria-modal="true" aria-label={testing ? t.lab.dialogTest : t.lab.dialogReport} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto border-4 border-ink bg-paper p-5 shadow-cut">
      <p className="font-display text-sm text-jam">{t.lab.kicker(round, rounds, n)}</p>
      <h2 className="font-display mt-2 text-2xl">{testing ? t.lab.titleTest : empty ? t.lab.titleEmpty : t.lab.titleDecide}</h2>
      {!testing ? <>
        <ConvergenceChart stats={stats} />
        <p className="mt-2 text-sm">{n < TOAST_CONFIG.decision.earlyN ? t.lab.early : t.lab.later}</p>
        <p className="mt-3 text-sm font-bold">{t.lab.question}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">{(["jam", "ham"] as const).map(kind => <Button key={kind} variant="outline" aria-pressed={guess === kind} className={guess === kind ? "bg-ink text-paper hover:bg-ink/90" : ""} onClick={() => setGuess(kind)}>{t.kinds[kind]}</Button>)}</div>
        <p className="mt-2 text-xs text-ink/70">{t.lab.rules(rounds)}</p>
        <Button disabled={guess === null || n === 0} className="mt-4 w-full bg-jam text-paper hover:bg-jam/90" onClick={() => { if (guess) onGuess(guess); }}>{t.lab.lock}</Button>
        {empty ? <Button variant="outline" className="mt-2 w-full" onClick={() => setTesting(true)}>{t.lab.takeTest(TOAST_CONFIG.stock.initial)}</Button> : <Button variant="outline" className="mt-2 w-full" onClick={onContinue}>{t.lab.keepPlaying}</Button>}
      </> : <>
        <p className="mt-2 text-sm">{t.lab.testIntro(TOAST_CONFIG.stock.initial, TOAST_CONFIG.revive.minCorrect)}</p>
        {t.lab.questions.map((q, i) => <fieldset key={q.question} className="mt-4" disabled={submitted}>
          <legend className="text-sm font-bold">{i + 1}. {q.question}</legend>
          <div className="mt-2 grid gap-2">{q.options.map((option, index) => <Button key={option} variant="outline" aria-pressed={answers[i] === index} className={`h-auto min-h-9 whitespace-normal justify-start text-left ${answers[i] === index ? "bg-ink text-paper hover:bg-ink/90" : ""}`} onClick={() => setAnswers(old => old.map((v, j) => j === i ? index : v))}>{option}</Button>)}</div>
          {submitted && <p className="mt-2 text-xs">{answers[i] === TOAST_CONFIG.revive.answerKey[i] ? t.lab.correct : t.lab.wrong}{q.explanation}</p>}
        </fieldset>)}
        {!submitted ? <><Button disabled={!result.complete} className="mt-4 w-full bg-jam text-paper hover:bg-jam/90" onClick={() => setSubmitted(true)}>{t.lab.check}</Button><Button variant="ghost" className="mt-2 w-full" onClick={() => setTesting(false)}>{t.lab.back}</Button></> : <><p role="status" className="mt-4 font-bold">{t.lab.testResult(result.correct, TOAST_CONFIG.revive.answerKey.length, result.passed)}</p><Button className="mt-3 w-full bg-jam text-paper hover:bg-jam/90" onClick={() => onTest(answers)}>{result.passed ? t.lab.revive(TOAST_CONFIG.stock.initial) : t.lab.seeResult}</Button></>}
      </>}
    </section>
  </div>;
}