import { NeighborhoodStats } from "./types";

function ratio(n: number, d: number) {
  return d > 0 ? n / d : 0;
}

export function computeLeaderboard(stats: NeighborhoodStats[]) {
  const happiest = [...stats]
    .map((s) => ({ name: s.name, score: ratio(s.counts.positive, s.total) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const stressed = [...stats]
    .map((s) => ({ name: s.name, score: ratio(s.counts.negative + s.counts.anxious, s.total) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { happiest, stressed };
}

export function computeImproved(today: NeighborhoodStats[], yesterday: NeighborhoodStats[]) {
  const ymap = new Map(yesterday.map((y) => [y.name.toLowerCase(), y] as const));
  const deltas = today.map((t) => {
    const y = ymap.get(t.name.toLowerCase());
    const tHappy = (t.counts.positive || 0) / (t.total || 1);
    const yHappy = y ? (y.counts.positive || 0) / (y.total || 1) : 0;
    return { name: t.name, delta: tHappy - yHappy };
  });
  return deltas.sort((a, b) => b.delta - a.delta).slice(0, 5);
}
