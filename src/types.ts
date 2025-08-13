export type Mood = "positive" | "neutral" | "negative" | "anxious" | "excited";

export interface MoodCounts {
  positive: number;
  neutral: number;
  negative: number;
  anxious: number;
  excited: number;
}

export interface NeighborhoodStats {
  name: string;
  counts: MoodCounts;
  total: number;
  dominant: Mood;
  emoji: string;
  examples: { title: string; time: string; url?: string }[];
}

export interface Leaderboard {
  happiest: { name: string; score: number }[];
  stressed: { name: string; score: number }[];
  improved: { name: string; delta: number }[];
}
