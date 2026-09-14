import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS = new Set([
  "https://bringittothetablecolorado.github.io",
  "http://localhost",
  "http://127.0.0.1",
]);

function cors(origin: string | null) {
  const allowed = origin && (
    ALLOWED_ORIGINS.has(origin) ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) ? origin : "https://bringittothetablecolorado.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + name + ">", "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function plainText(html: string) {
  return decodeXml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function monitorUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname === "news.google.com" && parsed.pathname === "/search") {
    return "https://news.google.com/rss/search?" + parsed.searchParams.toString() + "&hl=en-US&gl=US&ceid=US:en";
  }
  return url;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = cors(origin);
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers });
  if (origin && headers["Access-Control-Allow-Origin"] !== origin) {
    return new Response("Origin not allowed", { status: 403, headers });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401, headers });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: access, error: accessError } = await userClient.rpc("can_access_odyssey");
  if (accessError || access !== true) {
    return new Response("Forbidden", { status: 403, headers });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: sources, error: sourceError } = await admin
    .from("source_watch")
    .select("id,name,url,mission,kind")
    .eq("enabled", true)
    .order("id");
  if (sourceError) return new Response(JSON.stringify({ error: sourceError.message }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });

  const results = [];
  for (const source of sources || []) {
    try {
      const response = await fetch(monitorUrl(source.url), {
        headers: { "User-Agent": "ODYSSEY-Command-Center/1.0 (+https://www.odysseyrealtime.com/)" },
        redirect: "follow",
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const body = await response.text();
      const contentType = response.headers.get("content-type") || "";
      const isFeed = contentType.includes("xml") || /<rss|<feed/i.test(body.slice(0, 500));
      let inserted = 0;

      if (isFeed) {
        const items = body.match(/<item[\s\S]*?<\/item>/gi) || [];
        for (const item of items.slice(0, 20)) {
          const title = plainText(tag(item, "title"));
          const link = tag(item, "link");
          if (!title || !link) continue;
          const { data: existing } = await admin.from("story_updates").select("id").eq("source_url", link).limit(1);
          if (existing?.length) continue;
          const published = tag(item, "pubDate");
          const summary = plainText(tag(item, "description")).slice(0, 1200);
          const { error } = await admin.from("story_updates").insert({
            source_id: source.id,
            mission: source.mission,
            title,
            summary,
            source_url: link,
            published_at: published ? new Date(published).toISOString() : null,
            priority: source.mission === "MISSION-001" ? "HIGH" : "MEDIUM",
            raw_metadata: { monitor: "rss", source_kind: source.kind },
          });
          if (!error) inserted += 1;
        }
      } else {
        const title = plainText(tag(body, "title")) || source.name;
        const descriptionMatch = body.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i);
        const summary = descriptionMatch ? plainText(descriptionMatch[1]).slice(0, 1200) : "";
        const contentHash = await digest(title + "\n" + summary + "\n" + body.length);
        const { data: existing } = await admin.from("story_updates").select("id,raw_metadata").eq("source_id", source.id).order("discovered_at", { ascending: false }).limit(1);
        if (existing?.[0]?.raw_metadata?.content_hash !== contentHash) {
          const { error } = await admin.from("story_updates").insert({
            source_id: source.id,
            mission: source.mission,
            title,
            summary,
            source_url: source.url,
            priority: source.mission === "MISSION-001" ? "HIGH" : "MEDIUM",
            raw_metadata: { monitor: "html", source_kind: source.kind, content_hash: contentHash },
          });
          if (!error) inserted += 1;
        }
      }

      await admin.from("source_watch").update({ status: "ACTIVE", last_checked_at: new Date().toISOString() }).eq("id", source.id);
      results.push({ id: source.id, status: "ACTIVE", inserted });
    } catch (error) {
      await admin.from("source_watch").update({ status: "LIMITED", last_checked_at: new Date().toISOString() }).eq("id", source.id);
      results.push({ id: source.id, status: "LIMITED", error: error instanceof Error ? error.message : String(error) });
    }
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
