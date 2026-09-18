// First-party pageview logging for the Ops Hub's Rep America card (2026-09-18).
// Same gates as Whelth's tracker: declared bots/headless UAs are dropped, and
// the RPC caps undeclared scrapers at 60 hits/IP/hour. Filtered hits still get
// a 204 so a bot can't tell. Only a salted hash of the IP is stored.
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IP_SALT = "repamerica-pv-7f3a9c";
const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|preview|fetch|curl|wget|python|scrapy|httpclient|java\/|go-http|okhttp|axios|node-fetch|facebookexternalhit|embedly|quora link|pinterest|vkshare|w3c_validator|monitor|uptime|check|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|anthropic|openai|perplexity|yandex|baidu|bingpreview/i;

export async function POST(req: Request) {
  let body: { path?: string; referrer?: string } = {};
  try { body = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const path = String(body.path ?? "").slice(0, 300);
  if (!path.startsWith("/")) return new Response(null, { status: 400 });

  const h = req.headers;
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return new Response(null, { status: 204 });

  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const ipHash = ip ? createHash("sha256").update(IP_SALT + ip).digest("hex") : null;
  // Visitor = IP + UA for the day; enough to count uniques without a cookie.
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256").update(IP_SALT + ip + ua + day).digest("hex").slice(0, 32);

  try {
    await supabaseAdmin().rpc("track_pageview", {
      p_path: path,
      p_referrer: String(body.referrer ?? "").slice(0, 200),
      p_visitor_hash: visitorHash,
      p_ip_hash: ipHash,
      p_country: h.get("x-vercel-ip-country"),
      p_region: h.get("x-vercel-ip-country-region"),
      p_city: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : null,
      p_ua: ua.slice(0, 200),
    });
  } catch (e) {
    console.error("[track] failed", e);
  }
  return new Response(null, { status: 204 });
}
