// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import type and function from shared lib
// Note: Adjust path if needed based on your Deno import setup
export type SongstatsArtistInfo = {
  songstats_artist_id: string;
  avatar?: string | null;
  site_url?: string | null;
  name?: string | null;
  country?: string | null;
  bio?: string | null;
  genres?: string[] | null;
  links?: { source: string; external_id?: string | null; url?: string | null }[] | null;
  related_artists?: {
    songstats_artist_id: string;
    avatar?: string | null;
    site_url?: string | null;
    name?: string | null;
  }[] | null;
};

function normalizeArtistInfo(ai: SongstatsArtistInfo) {
  const genres = (ai.genres ?? []).filter(Boolean) as string[];

  const links = (ai.links ?? []).map(l => ({
    source: String(l.source || '').toLowerCase(),
    external_id: l.external_id ?? null,
    url: l.url ?? null,
  }));

  const socialsWhitelist = new Set([
    "instagram","tiktok","youtube","facebook","twitter","x","soundcloud"
  ]);

  const socialUrls: Record<string, string | null> = {};
  for (const l of links) {
    const s = l.source === "twitter" ? "x" : l.source;
    if (socialsWhitelist.has(s) && l.url) {
      socialUrls[s] = l.url;
    }
  }

  const related = (ai.related_artists ?? []).map(r => ({
    related_songstats_id: r.songstats_artist_id,
    name: r.name ?? null,
    avatar: r.avatar ?? null,
    site_url: r.site_url ?? null,
  }));

  return {
    core: {
      songstats_id: ai.songstats_artist_id,
      name: ai.name ?? null,
      country: ai.country ?? null,
      avatar_url: ai.avatar ?? null,
      songstats_url: ai.site_url ?? null,
      bio: ai.bio ?? null,
    },
    genres,
    links,
    related,
    socials: socialUrls,
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const SONGSTATS_API_KEY = Deno.env.get("SONGSTATS_API_KEY")!;
const RATE_DELAY_MS = Number(Deno.env.get("RATE_DELAY_MS") ?? 600);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type QueueRow = { id:string; artist_id:string; company_id:string; priority:string; retries:number; attempts:number; };

async function lockBatch(company_id: string, limit: number) {
  const { data, error } = await supabase.rpc("lock_enrich_batch", { _company_id: company_id, _limit: limit });
  if (error) throw error;
  return (data ?? []) as QueueRow[];
}

async function getSongstatsId(artist_id: string) {
  const { data, error } = await supabase.from("artists").select("songstats_id").eq("id", artist_id).single();
  if (error) throw error;
  return data?.songstats_id as string | null;
}

async function fetchArtistInfo(songstats_id: string) {
  const url = `https://public.songstats.com/api/artist/${encodeURIComponent(songstats_id)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${SONGSTATS_API_KEY}` } });
  if (!res.ok) throw new Error(`Songstats HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.artist_info) throw new Error("artist_info missing");
  return json.artist_info;
}

async function upsertAll(artist_id: string, company_id: string, ai: any) {
  const norm = normalizeArtistInfo(ai);

  await supabase.from("artists").update({
    songstats_id: norm.core.songstats_id,
    avatar_url: norm.core.avatar_url,
    songstats_url: norm.core.songstats_url,
    bio: norm.core.bio,
  }).eq("id", artist_id).eq("company_id", company_id);

  if (norm.genres.length > 0) {
    const payload = norm.genres.map((g) => ({ artist_id, company_id, genre: g, updated_at: new Date().toISOString() }));
    await supabase.from("artist_genres").upsert(payload, { onConflict: "artist_id,genre" });
  }

  if ((ai.links ?? []).length > 0) {
    const payload = norm.links.map((l:any) => ({
      artist_id, company_id, source: l.source, external_id: l.external_id, url: l.url, updated_at: new Date().toISOString()
    }));
    await supabase.from("artist_links_songstats").upsert(payload, { onConflict: "artist_id,source" });
  }

  if ((ai.related_artists ?? []).length > 0) {
    const payload = norm.related.map((r:any) => ({
      artist_id, company_id, related_songstats_id: r.related_songstats_id, name: r.name, avatar: r.avatar, site_url: r.site_url,
      updated_at: new Date().toISOString()
    }));
    await supabase.from("artist_related").upsert(payload, { onConflict: "artist_id,related_songstats_id" });
  }
}

async function markDone(id: string, ok: boolean, preview?: string) {
  const patch: any = { status: ok ? "done" : "error", updated_at: new Date().toISOString() };
  if (!ok) { patch.error_preview = (preview ?? "").slice(0,200); patch.error_message = preview ?? null; }
  await supabase.from("artist_enrich_queue").update(patch).eq("id", id);
}

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const company_id = body.company_id as string;
    const batch_size = Number(body.batch_size ?? 10);
    const dry_run    = Boolean(body.dry_run ?? false);
    if (!company_id) return new Response(JSON.stringify({ ok:false, error:"company_id required" }), { status: 400 });

    const batch = await lockBatch(company_id, batch_size);
    if (batch.length === 0) return new Response(JSON.stringify({ ok:true, locked:0 }), { status: 200 });

    for (const item of batch) {
      try {
        const sid = await getSongstatsId(item.artist_id);
        if (!sid) { await markDone(item.id, false, "missing songstats_id"); continue; }

        if (!dry_run) {
          const ai = await fetchArtistInfo(sid);
          await upsertAll(item.artist_id, item.company_id, ai);
        }

        await markDone(item.id, true);
        await new Promise(r => setTimeout(r, RATE_DELAY_MS));
      } catch (e:any) {
        await markDone(item.id, false, e?.message || String(e));
      }
    }

    return new Response(JSON.stringify({ ok:true, processed: batch.length }), { status: 200 });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || String(e) }), { status: 500 });
  }
});

