// Lê os projetos públicos do Behance da Laura e reescreve o carrossel de Portfólio (mais novo primeiro).
// Projeto privado some, projeto novo entra em primeiro.
import { readFileSync, writeFileSync } from "node:fs";
const FEED = "https://www.behance.net/feeds/user?username=lauracristina34";
const LIMIT = 8;
const UA = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" };

async function fromRss() {
  const res = await fetch(FEED + "&t=" + Date.now(), { headers: { ...UA, accept: "application/rss+xml,text/xml", "cache-control": "no-cache" } });
  if (!res.ok) throw new Error("rss " + res.status);
  const xml = await res.text();
  const pick = (b, t) => (b.match(new RegExp(`<${t}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${t}>`)) || [])[1]?.trim() || "";
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const b = m[1]; const img = (pick(b, "description").match(/src='([^']+)'/) || [])[1] || "";
    return { title: pick(b, "title"), link: pick(b, "link"), img, date: new Date(pick(b, "pubDate")) };
  });
}
async function fromRss2json() {
  const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(FEED), { headers: UA });
  const j = await res.json();
  if (j.status !== "ok") throw new Error("rss2json " + j.message);
  return j.items.map(it => ({ title: it.title, link: it.link, img: it.thumbnail || ((it.description || "").match(/src=['"]([^'"]+)['"]/) || [])[1] || "", date: new Date(it.pubDate.replace(" ", "T") + "Z") }));
}

let items = null;
for (const f of [fromRss, fromRss2json]) {
  try { items = await f(); if (items.length) { console.log("fonte:", f.name, items.length, "projetos"); break; } } catch (e) { console.log("falhou", f.name, e.message); }
}
if (!items || !items.length) { console.log("feed indisponível — nada alterado"); process.exit(0); }
items = items.map(i => ({ ...i, link: i.link.split("?")[0], img: i.img.replace("/projects/404/", "/projects/max_808_webp/") }))
  .filter(i => i.link && i.img).sort((a, b) => b.date - a.date).slice(0, LIMIT);
const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const cards = items.map((p, i) => `      <a class="pcard tilt" href="${esc(p.link)}" target="_blank" rel="noopener"><span class="spot"></span><div class="pimg"><img src="${esc(p.img)}" alt="${esc(p.title)}" width="404" height="316" loading="${i < 2 ? "eager" : "lazy"}" decoding="async"></div><div class="pmeta"><b>${esc(p.title)}</b><span>${p.date.getUTCFullYear()}</span></div></a>`).join("\n");
const file = "index.html"; const html = readFileSync(file, "utf8");
const out = html.replace(/<!-- PORTFOLIO:START -->[\s\S]*?<!-- PORTFOLIO:END -->/, `<!-- PORTFOLIO:START -->\n${cards}\n<!-- PORTFOLIO:END -->`);
if (out !== html) { writeFileSync(file, out); console.log(`portfólio atualizado: ${items.map(i => i.title).join(" · ")}`); } else console.log("sem mudanças");
