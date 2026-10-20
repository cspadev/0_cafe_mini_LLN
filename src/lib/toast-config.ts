/** All tunable courtyard, bonus and sound parameters live here. */
export const TOAST_CONFIG = {
  bonuses: { chef: 20, truck: 50 },
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
  people: { heightOfScene: 0.18, heightOfWidth: 0.14, chefScale: 1.12 },
  students: [
    { image: "student1", x: 0.3, y: 0.48, speed: 0.05, min: 0.12, max: 0.9 },
    { image: "student2", x: 0.7, y: 0.72, speed: -0.06, min: 0.3, max: 0.92 },
    { image: "student3", x: 0.55, y: 0.85, speed: -0.04, min: 0.35, max: 0.95 },
    { image: "student4", x: 0.2, y: 0.4, speed: 0.035, min: 0.1, max: 0.6 },
    { image: "student3", x: 0.77, y: 0.46, speed: -0.045, min: 0.15, max: 0.88 },
    { image: "student4", x: 0.4, y: 0.66, speed: 0.055, min: 0.2, max: 0.92 },
  ],
  audio: { volume: 0.28, truckVolume: 0.12, splatGapSeconds: 0.085 },
} as const;