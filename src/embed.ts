export function isEmbed(): boolean {
  const url = new URL(location.href);
  return url.searchParams.get("embed") === "1";
}

export function copyEmbed(): void {
  const origin = location.origin;
  const src = `${origin}/?embed=1`;
  const code = `<iframe src="${src}" width="600" height="400" style="border:0" loading="lazy"></iframe>`;
  navigator.clipboard.writeText(code);
}
