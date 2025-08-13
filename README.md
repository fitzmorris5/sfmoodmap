# SF Mood Map

The city’s mood, block by block — updated live from SF 311.

- Live map with neighborhood moods
- Emoji mode, leaderboard, embed widget
- Press kit and daily social card

## Live

Add your deployed URL here.

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build && npm run preview
```

## Embed

Copy this into your site:

```
<iframe src="https://YOURDOMAIN/?embed=1" width="600" height="400" style="border:0" loading="lazy"></iframe>
```

## Data Source

SF 311 Cases — Socrata `data.sfgov.org`. Public dataset (commonly `vw6y-z8j6`). The app auto-discovers if the ID changes.

## Mood Inference

Regex keyword rules approximate five moods:

- Positive: resolved|completed|removed|fixed|abated|work completed|closed (not duplicate)
- Negative: complaint|noise|graffiti|encampment|trash|overflow|pothole|blocked|illegal|abandoned|broken|vandal|hazard
- Anxious: suspicious|possible|concern|unsafe|fear|risk|emergency|alarm
- Excited: event|festival|parade|celebration|opening|grand
- Neutral: fallback

## Privacy

- Client-first, no accounts, no cookies. Optional Plausible analytics.

## Daily Social Card

- Template: `src/og-template.html`
- Generate PNG: `npm run gen:og` → saves to `public/share/daily.png`

## Launch Checklist

- Live URL loads under 2s
- OG/Twitter cards show image
- “Copy Embed” works
- Press page loads + has contact
- Daily card generated
- High-contrast mode OK
- Mobile tooltip readable
