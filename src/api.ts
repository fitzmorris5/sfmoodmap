import { z } from "zod";

const Rec = z.object({
  category: z.string().optional(),
  request_type: z.string().optional(),
  status_description: z.string().optional(),
  status: z.string().optional(),
  neighborhoods_sffind_boundaries: z.string().optional(),
  neighborhood: z.string().optional(),
  point: z
    .object({ type: z.string().optional(), coordinates: z.array(z.number()) })
    .optional(),
  updated_datetime: z.string(),
  service_request_id: z.string().optional(),
  service_request_parent_id: z.string().optional(),
});

export type Record311 = z.infer<typeof Rec>;

function isoMinusHours(h: number) {
  const d = new Date(Date.now() - h * 3600 * 1000);
  return d.toISOString();
}

async function discoverDataset(): Promise<string> {
  try {
    const url =
      "https://api.us.socrata.com/api/catalog/v1?only=datasets&domains=data.sfgov.org&q=" +
      encodeURIComponent("311 cases");
    const res = await fetch(url);
    const data = await res.json();
    const view = data?.results?.find((r: any) => /311 cases/i.test(r.resource?.name || ""));
    const id = view?.resource?.id;
    return id || "vw6y-z8j6";
  } catch {
    return "vw6y-z8j6";
  }
}

export async function get311(hours = 24): Promise<Record311[]> {
  const now = Date.now();
  const key = `311:${hours}`;
  const cached = localStorage.getItem(key);
  const ts = Number(localStorage.getItem(key + ":ts") || 0);
  if (cached && now - ts < 60_000) return JSON.parse(cached);

  let dataset = "vw6y-z8j6";
  try {
    const base = `https://data.sfgov.org/resource/${dataset}.json`;
    const url = `${base}?$select=category,request_type,status_description,status,neighborhoods_sffind_boundaries,neighborhood,point,updated_datetime,service_request_id,service_request_parent_id&$where=updated_datetime > '${isoMinusHours(hours)}'&$order=updated_datetime DESC&$limit=20000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const parsed = z.array(Rec).parse(data);
    localStorage.setItem(key, JSON.stringify(parsed));
    localStorage.setItem(key + ":ts", String(now));
    return parsed;
  } catch {
    dataset = await discoverDataset();
    const base = `https://data.sfgov.org/resource/${dataset}.json`;
    const url = `${base}?$select=category,request_type,status_description,status,neighborhoods_sffind_boundaries,neighborhood,point,updated_datetime,service_request_id,service_request_parent_id&$where=updated_datetime > '${isoMinusHours(hours)}'&$order=updated_datetime DESC&$limit=20000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("311 fetch failed");
    const data = await res.json();
    const parsed = z.array(Rec).parse(data);
    localStorage.setItem(key, JSON.stringify(parsed));
    localStorage.setItem(key + ":ts", String(now));
    return parsed;
  }
}

export function recordText(r: Record311): string {
  const fields = [r.category, r.request_type, r.status_description, r.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return fields;
}

export function recordTitle(r: Record311): string {
  return r.request_type || r.category || r.status_description || "311 Item";
}

export function recordUrl(r: Record311): string | undefined {
  const id = r.service_request_id || r.service_request_parent_id;
  if (!id) return undefined;
  return `https://data.sfgov.org/resource/vw6y-z8j6/${encodeURIComponent(id)}`;
}
