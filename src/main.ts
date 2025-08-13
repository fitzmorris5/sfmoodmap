import { get311, recordText, recordTitle, recordUrl, type Record311 } from './api';
import { classify, emojiForMood, moodColor, type Mood } from './mood';
import { isEmbed, copyEmbed } from './embed';
import { initMap, setEmojiVisible, setHighContrast, updateNeighborhoodMoods, wireTooltip } from './map';
import { computeLeaderboard, computeImproved } from './leaderboard';

interface Agg { [name: string]: { counts: Record<Mood, number>; examples: { title: string; time: string; url?: string }[] } }

function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d);
}

function normalizeNeighborhoodName(s?: string | null) {
  return (s || '').trim().toLowerCase();
}

async function aggregateByNeighborhood(records: Record311[]) {
  const agg: Agg = {};
  for (const r of records) {
    const text = recordText(r);
    const mood = classify(text);
    const n1 = normalizeNeighborhoodName(r.neighborhoods_sffind_boundaries);
    const n2 = normalizeNeighborhoodName((r as any).neighborhood);
    const name = n1 || n2 || '';
    if (!name) continue;
    const bucket = (agg[name] ||= {
      counts: { positive: 0, neutral: 0, negative: 0, anxious: 0, excited: 0 },
      examples: [],
    } as any);
    bucket.counts[mood as Mood] = (bucket.counts[mood as Mood] || 0) + 1;
    if (bucket.examples.length < 5) {
      bucket.examples.push({ title: recordTitle(r), time: fmtTime(r.updated_datetime), url: recordUrl(r) });
    }
  }
  const stats = Object.entries(agg).map(([name, v]) => {
    const total = (Object.values(v.counts) as number[]).reduce((a, b) => a + b, 0) || 1;
    const dominant = (Object.entries(v.counts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'neutral') as Mood;
    return {
      name,
      counts: v.counts as any,
      total,
      dominant,
      emoji: emojiForMood(dominant),
      examples: v.examples,
    };
  });
  return stats;
}

function byNameMap(stats: Awaited<ReturnType<typeof aggregateByNeighborhood>>): Record<string, { mood: Mood; emoji: string, counts: Record<Mood, number>, total: number, examples: any[] }> {
  const map: Record<string, any> = {};
  for (const s of stats) map[s.name] = { mood: s.dominant, emoji: s.emoji, counts: s.counts, total: s.total, examples: s.examples };
  return map;
}

function titleCase(s: string) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

function renderLeaderboard(listId: string, items: { name: string; score?: number; delta?: number }[]) {
  const el = document.getElementById(listId)!;
  el.innerHTML = items.map((i) => `<li class="leading-6">${titleCase(i.name)} <span class="text-neutral-400">${i.score !== undefined ? (i.score*100).toFixed(0)+"%" : (i.delta!==undefined ? (i.delta*100).toFixed(0)+"%" : '')}</span></li>`).join('');
}

async function getYesterday24hOnce(): Promise<any[]> {
  const key = 'yesterday:311:24h';
  const day = new Date().toDateString();
  const stamp = localStorage.getItem(key+":day");
  const cached = localStorage.getItem(key);
  if (cached && stamp === day) return JSON.parse(cached);
  const rec48 = await get311(48);
  const cutoffLo = Date.now() - 48*3600*1000;
  const cutoffHi = Date.now() - 24*3600*1000;
  const rec = rec48.filter(r => {
    const t = new Date(r.updated_datetime).getTime();
    return t >= cutoffLo && t <= cutoffHi;
  });
  localStorage.setItem(key, JSON.stringify(rec));
  localStorage.setItem(key+":day", day);
  return rec;
}

async function main() {
  if (isEmbed()) document.body.classList.add('embed');

  await initMap();
  const timeSel = document.getElementById('timeWindow') as HTMLSelectElement;
  const emojiToggle = document.getElementById('emojiToggle') as HTMLInputElement;
  const contrastToggle = document.getElementById('contrastToggle') as HTMLInputElement;
  const embedBtn = document.getElementById('embedBtn') as HTMLButtonElement;
  const updatedAt = document.getElementById('updatedAt')!;
  const degraded = document.getElementById('degraded')!;

  embedBtn?.addEventListener('click', () => copyEmbed());

  emojiToggle?.addEventListener('change', () => setEmojiVisible(emojiToggle.checked));
  contrastToggle?.addEventListener('change', () => {
    document.body.classList.toggle('high-contrast', contrastToggle.checked);
    setHighContrast(contrastToggle.checked);
  });

  let currentByName: Record<string, any> = {};
  let hoodGeo: any = await (await fetch('/sf-neighborhoods.geojson')).json();

  const renderTooltip = (nameKey: string) => {
    const key = nameKey.toLowerCase();
    const s = currentByName[key];
    if (!s) return `<div><h3>${nameKey}</h3><div class="text-neutral-400">No data</div></div>`;
    const counts = s.counts;
    const total = s.total || 1;
    const pct = (n: number)=> ((n/total)*100).toFixed(0)+"%";
    const list = (s.examples||[]).map((e:any)=>`<li>${e.title} <span class=\"text-neutral-500\">${e.time}</span></li>`).join('');
    return `<div>
      <h3>${nameKey} ${s.emoji || ''}</h3>
      <div class="text-neutral-300 text-xs">
        Positive ${pct(counts.positive)} • Neutral ${pct(counts.neutral)} • Negative ${pct(counts.negative)} • Anxious ${pct(counts.anxious)} • Excited ${pct(counts.excited)}
      </div>
      <ol class="mt-2">${list}</ol>
    </div>`;
  };

  wireTooltip(renderTooltip as any);

  async function refresh() {
    try {
      const hours = Number(timeSel.value || '24');
      const rec = await get311(hours);
      const stats = await aggregateByNeighborhood(rec);
      currentByName = byNameMap(stats);
      updateNeighborhoodMoods(hoodGeo, currentByName);
      const lb = computeLeaderboard(stats as any);
      renderLeaderboard('happyList', lb.happiest);
      renderLeaderboard('stressList', lb.stressed);

      const yRec = await getYesterday24hOnce();
      const yStats = await aggregateByNeighborhood(yRec);
      const improved = computeImproved(stats as any, yStats as any);
      renderLeaderboard('improvedList', improved);

      setEmojiVisible(emojiToggle.checked);
      setHighContrast(contrastToggle.checked);
      updatedAt.textContent = new Date().toLocaleString();
      degraded.classList.add('hidden');
    } catch (e) {
      console.error(e);
      degraded.classList.remove('hidden');
    }
  }

  (document.getElementById('shareX') as HTMLButtonElement)?.addEventListener('click', () => {
    const text = encodeURIComponent('Today’s mood of SF — live from 311');
    const url = encodeURIComponent(location.href);
    const x = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(x, '_blank');
  });
  (document.getElementById('shareCopy') as HTMLButtonElement)?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(location.href);
  });

  timeSel.addEventListener('change', refresh);

  await refresh();
}

main();
