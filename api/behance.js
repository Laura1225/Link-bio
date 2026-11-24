// Conector ao vivo do Behance para a bio (roda no Vercel). Sem cache longo: projeto novo/privado reflete em ~1 min.
export const config = { runtime: "edge" };
const FEED = "https://www.behance.net/feeds/user?username=lauracristina34";

export default async function handler() {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "public, s-maxage=60, stale-while-revalidate=30",
  };
  try {
    const r = await fetch(FEED + "&t=" + Date.now(), {
      headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", accept: "application/rss+xml,text/xml", "cache-control": "no-cache" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error("rss " + r.status);
    const xml = await r.text();
    const pick = (b, t) => (b.match(new RegExp(`<${t}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${t}>`)) || [])[1]?.trim() || "";
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
      const b = m[1];
      const img = ((pick(b, "description").match(/src='([^']+)'/) || [])[1] || "").replace("/projects/404/", "/projects/max_808_webp/");
      return { title: pick(b, "title"), link: pick(b, "link").split("?")[0], img, date: new Date(pick(b, "pubDate")).toISOString() };
    }).filter((i) => i.link && i.img).sort((a, b) => (a.date < b.date ? 1 : -1));
    return new Response(JSON.stringify({ ok: true, items }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 502, headers: { ...headers, "cache-control": "no-store" } });
  }
}
