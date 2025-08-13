export type Mood = "positive" | "neutral" | "negative" | "anxious" | "excited";

const RX = {
  positive: /(resolved|completed|removed|fixed|abated|work completed|closed(?!.*duplicate))/i,
  negative: /(complaint|noise|graffiti|encampment|trash|overflow|pothole|blocked|illegal|abandoned|broken|vandal|hazard)/i,
  anxious: /(suspicious|possible|concern|unsafe|fear|risk|emergency|alarm)/i,
  excited: /(event|festival|parade|celebration|opening|grand)/i,
};

export function classify(text: string): Mood {
  if (RX.positive.test(text)) return "positive";
  if (RX.excited.test(text)) return "excited";
  if (RX.anxious.test(text)) return "anxious";
  if (RX.negative.test(text)) return "negative";
  return "neutral";
}

export function emojiForMood(m: Mood): string {
  switch (m) {
    case "positive": return "😄";
    case "neutral":  return "😐";
    case "negative": return "😡";
    case "anxious":  return "😰";
    case "excited":  return "🤩";
  }
}

export function moodColor(m: string, highContrast = false): string {
  if (highContrast) {
    switch (m) {
      case "positive": return "#00e676";
      case "neutral":  return "#ffea00";
      case "negative": return "#ff1744";
      case "anxious":  return "#b388ff";
      case "excited":  return "#00b0ff";
      default: return "#bdbdbd";
    }
  }
  switch (m) {
    case "positive": return "#00C853";
    case "neutral":  return "#FFD54F";
    case "negative": return "#FF5252";
    case "anxious":  return "#7E57C2";
    case "excited":  return "#29B6F6";
    default: return "#BDBDBD";
  }
}
