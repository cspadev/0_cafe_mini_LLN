import type { ReactNode } from "react";
import { TOAST_CONFIG as C } from "@/lib/toast-config";

const share = (total: number) => (total === 3 ? "⅓" : `1/${total}`);
/** 1 toast, 2–4 toasty, 5+ toastů */
const toasts = (n: number) => `${n} ${n === 1 ? "toast" : n >= 2 && n <= 4 ? "toasty" : "toastů"}`;

type Panel = { title: string; bubble: ReactNode; caption: ReactNode };
type Question = { question: string; options: [string, string, string]; explanation: string };

/** Czech texts – the default language. The shape of this object is the type for every language. */
export const cs = {
  htmlLang: "cs",
  locale: "cs-CZ",
  meta: {
    title: "Murphyho toastová laboratoř – hra o zákonu velkých čísel",
    description: "Shazuj toasty s marmeládou a šunkou z balkonu školy a sleduj, jak se průměry ustalují. Zákon velkých čísel v praxi.",
    ogTitle: "Murphyho toastová laboratoř",
    ogDescription: "Shazuj toasty, zamaž nádvoří a objev zákon velkých čísel.",
  },
  kinds: { jam: "Marmeláda", ham: "Šunka" } as Record<"jam" | "ham", string>,
  header: {
    title: "MURPHYHO TOASTOVÁ LABORATOŘ",
    controls: "Ovládání hry",
    scoreLabel: "Kolo a skóre",
    score: (round: number, total: number, score: number) => `K${round}/${total} · ${score} %`,
    labReport: "Tip / laboratorní zpráva",
    mute: "Vypnout zvuky",
    unmute: "Zapnout zvuky",
    hose: "Umýt nádvoří hadicí",
    newExperiment: "Nový pokus",
  },
  banners: {
    settle: "NECH TOASTY DOPADNOUT…",
    labReport: "LABORATORNÍ ZPRÁVA",
    chefBonus: (n: number) => `+${toasts(n).toUpperCase()} DO ZÁSOBY!`,
    truckBonus: (n: number) => `+${toasts(n).toUpperCase()} Z NÁKLAĎÁKU!`,
  },
  bubbles: {
    student: ["FUJ!", "MOJE MIKINA!", "KDO TO BYL?!", "Zase ne…", "Murphy!!", "DO VLASŮ?!"],
    chef: ["MON DIEU!", "MŮJ TÁC!", "AAAA!", "SACRÉ TOAST!"],
    truck: "TÚÚÚ!! OTEVŘENÉ DVEŘE!",
  },
  stock: {
    label: "Zásoba toastů",
    count: (n: number) => `ZÁSOBA: ${n}`,
    jam: "TOAST S MARMELÁDOU",
    ham: "TOAST SE ŠUNKOU",
    empty: "DOŠLY TOASTY!",
  },
  footer: {
    label: "Průběžné průměry pokusu",
    toppingDown: "NAMAZANOU STRANOU DOLŮ",
    toastAlt: (kind: string) => `Toast – ${kind.toLowerCase()}`,
  },
  chart: {
    label: "Průběžný podíl toastů, které dopadly namazanou stranou dolů",
    wildZone: (n: number) => `divoká zóna N<${n}`,
    axis: "N (log)",
  },
  intro: {
    dialog: "Než začneš",
    kicker: "DNEŠNÍ POKUS",
    title: "Dva zákony vejdou na nádvoří…",
    lead: <>Věřit se dá jen jednomu z nich. Vyzkoušíme oba – vědecky, z balkonu a s <i>pořádnou</i> hromadou toastů.</> as ReactNode,
    mission: (
      <>
        <b>Tvůj úkol:</b> {C.rounds.count} kola, {C.rounds.count} šance poznat, která pomazánka má větší smůlu. Každé kolo začíná s {toasts(C.stock.initial)} a s novými tajnými pravděpodobnostmi, které se liší jen o {C.rounds.gapPoints[0]}–{C.rounds.gapPoints[1]} procentních bodů. Za každý zásah studenta dostaneš zpět {toasts(C.stock.studentHit)}, kuchař přidá {C.bonuses.chef}. Náklaďák spustí smršť {toasts(C.bonuses.truck)}! Správný konečný tip ti přinese {share(C.rounds.count)} skóre, špatný tip znamená prohrané kolo. Na kontrolních bodech se rozhodni: tipnout hned, nebo sbírat další data? Došly toasty? Tipni si, nebo odpověz na tři laboratorní otázky – za alespoň {C.revive.minCorrect} správnou odpověď dostaneš {toasts(C.stock.initial)} navíc, bez ztráty bodů. Jinak je kolo prohrané.
      </>
    ) as ReactNode,
    start: "SPUSTIT POKUS",
  },
  lab: {
    dialogReport: "Laboratorní zpráva kola",
    dialogTest: "Laboratorní test o nové toasty",
    kicker: (round: number, total: number, n: number) => `KOLO ${round} / ${total} · N = ${n}`,
    titleTest: "Vysluž si další bochník",
    titleEmpty: "Došly toasty. Rozhodneš se?",
    titleDecide: "Tipnout teď… nebo házet dál?",
    early: "Pár šťastných dopadů tě může snadno oklamat. Je ještě schválně brzy – další pozorování můžou obrázek změnit.",
    later: "S dalšími pozorováními se průměry obvykle ustálí, ale malý rozdíl může být pořád těžké rozpoznat.",
    question: "Která pomazánka má větší skutečnou pravděpodobnost, že toast dopadne namazanou stranou dolů?",
    rules: (total: number) => `Správný konečný tip ti přinese ${share(total)} skóre. Špatný tip ukončí kolo bez bodů.`,
    lock: "Potvrdit konečný tip",
    takeTest: (n: number) => `Laboratorní test o +${toasts(n)}`,
    keepPlaying: "Hrát dál – sbírat další data",
    testIntro: (n: number, min: number) => `Odpověz na všechny tři otázky. Za alespoň ${min} správnou odpověď dostaneš ${toasts(n)} navíc, bez ztráty bodů. Jinak je kolo prohrané.`,
    check: "Zkontrolovat odpovědi",
    back: "Zpět ke konečnému tipu",
    correct: "✓ Správně. ",
    wrong: "✗ Tak úplně ne. ",
    testResult: (correct: number, count: number, passed: boolean) => `${correct}/${count} správně – ${passed ? "nové toasty schváleny!" : "kolo je prohrané."}`,
    revive: (n: number) => `Pokračovat s ${toasts(n)}`,
    seeResult: "Zobrazit výsledek kola",
    questions: [
      { question: "Který vzorek obvykle dává stabilnější průběžný průměr?", options: ["10 hodů", "500 hodů", "Oba jsou vždy stejně stabilní"], explanation: "Větší vzorky dávají obvykle stabilnější průměry." },
      { question: "Po pouhých 10 hodech vede marmeláda. Co z toho plyne?", options: ["Marmeláda má určitě vyšší skutečnou pravděpodobnost", "Šunka to musí v dalším hodu dohnat", "Vzorek může být na rozhodnutí příliš malý"], explanation: "Malý vzorek může klamat a žádná pomazánka nemusí nic „dohánět“." },
      { question: "Jak přibývá hodů, průběžný průměr se blíží…", options: ["skutečné pravděpodobnosti dané pomazánky", "přesně 50 %, bez ohledu na pravděpodobnosti", "100 %, protože to říká Murphy"], explanation: "Zákon velkých čísel vede ke skutečné pravděpodobnosti, ne nutně k 50 %." },
    ] as Question[],
  },
  result: {
    dialog: "Výsledek kola",
    kicker: (round: number, total: number) => `KOLO ${round} / ${total}`,
    titleCorrect: "Správná pomazánka. Pěkná věda!",
    titleLost: "Tohle kolo je prohrané.",
    testFailed: "Laboratorní test nevyšel – správných odpovědí bylo málo.",
    guessed: (kind: string) => `Tvůj tip: ${kind}.`,
    trueOdds: (jam: string, ham: string, n: number) => `Skutečné pravděpodobnosti: marmeláda ${jam} · šunka ${ham}, po ${n} ${n === 1 ? "pozorování" : "pozorováních"}.`,
    gainCorrect: (total: number) => `+${share(total)} celkového skóre`,
    gainNone: "+0 bodů",
    score: (score: number) => `Skóre: ${score} %`,
    seeFinal: "Zobrazit celkové hodnocení",
    nextRound: (n: number) => `Spustit ${n}. kolo`,
  },
  debrief: {
    dialog: "Hodnocení pokusu",
    kicker: (n: string) => `HODNOCENÍ POKUSU · N = ${n}`,
    titleTop: "Certifikovaný toastový vědec!",
    titleMid: "Nadějný drobečkový výzkumník",
    titleLow: "Tentokrát tě Murphy dostal…",
    summary: (score: number, correct: number, total: number) => `Celkové skóre: ${score} % · ${correct}/${total} správných kol · Bez srážek za nové toasty.`,
    round: (n: number) => `${n}. kolo:`,
    roundCorrect: (total: number) => `✓ Správný tip · +${share(total)}`,
    roundTestFailed: "✗ Laboratorní test nevyšel · +0",
    roundWrong: "✗ Špatný tip · +0",
    roundOdds: (n: number, jam: string, ham: string) => `N=${n} · skutečnost: marmeláda ${jam} / šunka ${ham}`,
    explanation: (
      <>
        <b>Co se stalo?</b> Na začátku čáry skákaly sem a tam – pár šťastných dopadů mohlo kteroukoli pomazánku udělat „prokletou“. Jak N rostlo, každý další toast už průměr posunul méně a čáry se <b>ustálily</b> u skutečných pravděpodobností. To je zákon velkých čísel: než se s rozumnou jistotou rozhodneš, potřebuješ <b>dost pozorování</b>. A Murphy? Toast <i>nepadá vždycky</i> namazanou stranou dolů – stává se to jen dost často na to, aby to vypadalo jako osobní útok.
      </>
    ) as ReactNode,
    outroTitle: "Počkej – jsou skutečné toasty prokleté?",
    newExperiment: "NOVÝ POKUS (NOVÉ TAJNÉ PRAVDĚPODOBNOSTI)",
    finish: "POKRAČOVAT",
  },
  comics: {
    intro: [
      {
        title: "ZÁKON Č. 1 · MURPHYHO ZÁKON",
        bubble: "NEEE! Ne marmeládou dolů!",
        caption: <>„Co se může pokazit, to se pokazí.“ Lidová moudrost tvrdí, že upuštěný toast dopadne <b>vždycky</b> namazanou stranou dolů. Vesmír tvoji snídani nesnáší.</>,
      },
      {
        title: "ZÁKON Č. 2 · ZÁKON VELKÝCH ČÍSEL",
        bubble: "Jeden toast mi neřekne nic. Tisíc toastů mi řekne pravdu.",
        caption: <>Jeden dopad je čistá náhoda. Čím víckrát ale náhodný pokus zopakuješ, tím víc se <b>průměr</b> blíží skutečné pravděpodobnosti. Malé vzorky lžou, velké se přiznají.</>,
      },
    ] as Panel[],
    outro: [
      {
        title: "1995 · PADAJÍCÍ TOAST",
        bubble: "Za to nemůže máslo. Za to může stůl!",
        caption: <>Britský fyzik <b>Robert Matthews</b> publikoval článek „Padající toast, Murphyho zákon a základní fyzikální konstanty“. Toast, který sklouzne ze stolu, se stihne otočit jen asi <b>o půl otáčky</b> – a tak dopadne máslem dolů zhruba v <b>60 %</b> případů.</>,
      },
      {
        title: "1996 · IG NOBELOVA CENA",
        bubble: "Může za to výška lidí, ne máslo!",
        caption: <>Získal za to <b>Ig Nobelovu cenu za fyziku</b> – parodii na Nobelovu cenu za výzkum, který „nejdřív rozesměje, a pak přiměje přemýšlet“. Stoly jsou tak vysoké, jak vysocí jsou lidé… a to závisí na základních fyzikálních konstantách!</>,
      },
    ] as Panel[],
  },
  errors: {
    notFoundTitle: "Stránka nenalezena",
    notFoundText: "Hledaná stránka neexistuje nebo byla přesunuta.",
    home: "Na úvod",
    loadTitle: "Stránka se nenačetla",
    loadText: "Něco se pokazilo. Zkus stránku obnovit nebo se vrátit na úvod.",
    retry: "Zkusit znovu",
  },
};

export type Texts = typeof cs;
