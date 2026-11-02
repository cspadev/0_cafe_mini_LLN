/** All tunable game parameters live here. Texts live in src/i18n. */
export const TOAST_CONFIG = {
  stock: {
    /** Toasts at the start of each round and after a successful revive test. */
    initial: 30,
    /** Toasts returned for hitting a student. */
    studentHit: 1,
  },
  rounds: {
    count: 3,
    /** Lower of the two secret probabilities, in percent: drawn uniformly from this range. */
    oddsLowPercent: [35, 70] as const,
    /** The higher probability is this many percentage points above the lower one. */
    gapPoints: [3, 8] as const,
  },
  /** Checkpoints (total drops N) at which the lab notebook opens automatically. */
  milestones: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  decision: {
    /** Below this N the lab notebook warns that the sample is still small. */
    earlyN: 50,
  },
  revive: {
    /** Correct answers (of the three lab questions) needed for a fresh stock. */
    minCorrect: 1,
    /** Index of the correct option for each question in src/i18n (same order in every language). */
    answerKey: [1, 2, 0] as const,
  },
  /** Final evaluation title thresholds, in percent of the total score. */
  debrief: { topPercent: 75, midPercent: 45 },
  bonuses: { chef: 20, truck: 50 },
  throwing: {
    /** Seconds between toasts while the button is held. */
    holdIntervalSeconds: 0.12,
    /** Extra pause before the second toast when the button is held (negative = later). */
    holdStartSeconds: -0.25,
    /** Pause before the next toast appears in the hand. */
    reloadSeconds: 0.12,
    /** Random spread around the aim point, as a share of the scene. */
    aimScatter: 0.04,
    /** Toasts cannot be aimed above this share of the scene height (balcony edge). */
    minAimY: 0.28,
    /** Flight time range in seconds. */
    flightSeconds: [0.9, 1.25] as const,
    /** Toast size on the ground, as a share of the scene height (scaled by depth). */
    groundSize: 0.055,
  },
  truck: {
    pathY: 0.59,
    outsideX: 1.45,
    stopX: 0.8,
    speed: 0.055,
    stopSeconds: 5,
    firstVisitSeconds: [15, 25] as const,
    betweenVisitsSeconds: [45, 80] as const,
    heightInStudents: 1.5,
    widthToHeight: 998 / 555,
    dropIntervalSeconds: 0.025,
  },
  chef: { x: 0.45, y: 0.6, speed: 0.07, min: 0.25, max: 0.8 },
  reactions: {
    /** Seconds a hit actor wobbles and runs faster. */
    studentSeconds: 1.2,
    chefSeconds: 1.6,
    truckSeconds: 2,
    /** Speed multiplier while a hit actor is panicking. */
    panicSpeed: 2.5,
  },
  /** Seconds a banner (bonus, notice) stays on screen. */
  bannerSeconds: 1.8,
  /** The chart shades N below this value as the "wild zone". */
  chartWildZoneN: 20,
  people: { heightOfScene: 0.18, heightOfWidth: 0.14, chefScale: 1.12 },
  courtyard: { width: 1536, height: 1024 },
  walkingPaths: {
    upper: { y: 0.44, min: 0.48, max: 0.74 },
    middle: { y: 0.57, min: 0.24, max: 0.88 },
    lower: { y: 0.70, min: 0.32, max: 0.60 },
    near: { y: 0.80, min: 0.39, max: 0.54 },
  },
  students: [
    { image: "student1", x: 0.50, path: "upper", speed: 0.035 },
    { image: "student2", x: 0.56, path: "lower", speed: -0.04 },
    { image: "student3", x: 0.50, path: "near", speed: -0.025 },
    { image: "student4", x: 0.28, path: "middle", speed: 0.035 },
    { image: "student5", x: 0.69, path: "upper", speed: -0.03 },
    { image: "student6", x: 0.75, path: "middle", speed: -0.045 },
    { image: "student5", x: 0.36, path: "lower", speed: 0.03 },
    { image: "student6", x: 0.43, path: "near", speed: 0.025 },
  ],
  audio: { volume: 0.28, truckVolume: 0.12, splatGapSeconds: 0.085 },
} as const;
