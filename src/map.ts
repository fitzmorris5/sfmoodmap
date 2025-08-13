import maplibregl, { Map } from "maplibre-gl";
import { moodColor } from "./mood";

export interface NeighborhoodFeatureProperties {
  name: string;
  mood?: string;
  emoji?: string;
  counts?: Record<string, number>;
}

let map: Map | null = null;
let highContrast = false;

export function setHighContrast(enabled: boolean) {
  highContrast = enabled;
  if (!map) return;
  recolorLayer();
}

export async function initMap(): Promise<Map> {
  if (map) return map;
  map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      name: "blank",
      sources: {},
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#efefef" } },
      ],
    } as any,
    center: [-122.4376, 37.7577],
    zoom: 11.2,
    attributionControl: { customAttribution: "SF 311, MapLibre" },
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

  await new Promise<void>((resolve) => map!.once("load", () => resolve()));

  const neighborhoods = await (await fetch("/sf-neighborhoods.geojson")).json();

  map.addSource("hoods", { type: "geojson", data: neighborhoods });

  map.addLayer({
    id: "hood-fills",
    type: "fill",
    source: "hoods",
    paint: {
      "fill-color": ["coalesce", ["get", "_color"], "#BDBDBD"],
      "fill-opacity": 0.6,
    },
  });

  map.addLayer({
    id: "hood-borders",
    type: "line",
    source: "hoods",
    paint: {
      "line-color": "#ffffff",
      "line-width": 0.6,
    },
  });

  map.addLayer({
    id: "hood-emoji",
    type: "symbol",
    source: "hoods",
    layout: {
      "text-field": ["coalesce", ["get", "emoji"], ""],
      "text-size": 24,
      "text-allow-overlap": true,
    },
  });

  return map;
}

function recolorLayer() {
  if (!map) return;
  const source: any = map.getSource("hoods");
  if (!source) return;
  const data: any = source._data || (source.serialize ? source.serialize() : null);
  const geo = (map.getSource("hoods") as any).serialize ? (map.getSource("hoods") as any).serialize().data : (source._data as any);
  if (!geo) return;
}

export function updateNeighborhoodMoods(hoodData: GeoJSON.FeatureCollection, byName: Record<string, { mood: string; emoji: string }>) {
  if (!map) return;
  const updated: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: hoodData.features.map((f: any) => {
      const name: string = f.properties?.name || f.properties?.Name || f.properties?.NAME || "";
      const key = name.trim().toLowerCase();
      const stats = byName[key];
      const color = moodColor(stats?.mood || "neutral", highContrast);
      return {
        ...f,
        properties: {
          ...f.properties,
          mood: stats?.mood || "neutral",
          emoji: stats?.emoji || "",
          _color: color,
        },
      } as any;
    }),
  } as any;

  const src = map.getSource("hoods") as any;
  if (src) src.setData(updated as any);
}

export function wireTooltip(render: (name: string) => string) {
  if (!map) return;
  const tooltip = document.getElementById("tooltip")!;
  map.on("mousemove", "hood-fills", (e: any) => {
    const f = e.features?.[0];
    if (!f) return;
    const name = f.properties?.name || f.properties?.Name || f.properties?.NAME || "Neighborhood";
    tooltip.innerHTML = render(String(name));
    tooltip.classList.remove("hidden");
    tooltip.style.left = e.point.x + 12 + "px";
    tooltip.style.top = e.point.y + 12 + "px";
  });
  map.on("mouseleave", "hood-fills", () => {
    tooltip.classList.add("hidden");
  });
}

export function setEmojiVisible(visible: boolean) {
  if (!map) return;
  map.setLayoutProperty("hood-emoji", "visibility", visible ? "visible" : "none");
}
