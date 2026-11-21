// Lê o RSS do Behance da Laura e reescreve o carrossel de Portfólio (mais novo primeiro).
import { readFileSync, writeFileSync } from "node:fs";
const FEED = "https://www.behance.net/feeds/user?username=lauracristina34";
const LIMIT = 8;
const res = await fetch(FEED, { headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", accept: "application/rss+xml,text/xml" } });
if (!res.ok) { console.log("feed indisponível:", res.status); process.exit(0); }
const xml = await res.text();
const pick = (b, t) => (b.match(new RegExp(`<${t}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${t}>`)) || [])[1]?.trim() || "";
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
  const b = m[1]; const img = (pick(b, "description").match(/src='([^']+)'/) || [])[1] || "";
  return { title: pick(b, "title"), link: pick(b, "link"), img: img.replace("/projects/404/", "/projects/max_808_webp/"), date: new Date(pick(b, "pubDate")) };
}).filter(i => i.link && i.img).sort((a, b) => b.date - a.date).slice(0, LIMIT);
if (!items.length) { console.log("nenhum projeto no feed"); process.exit(0); }
const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const cards = items.map((p, i) => `      <a class="pcard tilt" href="${esc(p.link)}" target="_blank" rel="noopener"><span class="spot"></span><div class="pimg"><img src="${esc(p.img)}" alt="${esc(p.title)}" width="404" height="316" loading="${i < 2 ? "eager" : "lazy"}" decoding="async"></div><div class="pmeta"><b>${esc(p.title)}</b><span>${p.date.getUTCFullYear()}</span></div></a>`).join("\n");
const file = "index.html"; const html = readFileSync(file, "utf8");
const out = html.replace(/<!-- PORTFOLIO:START -->[\s\S]*?<!-- PORTFOLIO:END -->/, `<!-- PORTFOLIO:START -->\n${cards}\n<!-- PORTFOLIO:END -->`);
if (out !== html) { writeFileSync(file, out); console.log(`portfólio atualizado: ${items.length} projetos`); } else console.log("sem mudanças");
