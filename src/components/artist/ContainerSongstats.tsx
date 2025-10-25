import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Globe2, Music2, CalendarDays, Link as LinkIcon } from "lucide-react";

type SongstatsPayload = {
  stats: {
    spotify_followers?: number | null;
    spotify_monthly_listeners?: number | null;
    instagram_followers?: number | null;
    last_stats_updated_at?: string | null;
  };
  geo: { country_code: string; audience_count: number }[];
  tracks: { source: string; rank: number; name: string; track_external_id: string; popularity: number | null; updated_at: string }[];
  events: { date: string | null; city: string | null; country: string | null; venue: string | null; url: string | null; updated_at: string | null }[];
  info: { artist_spotify_id?: string | null; artist_spotify_url?: string | null; artist_name?: string | null; last_updated_any?: string | null };
  stats_all?: Record<string, Record<string, { value: number; unit: string | null; updated_at: string }>>;
  stats_list?: { source: string; metric: string; value: number; unit: string | null; updated_at: string }[];
};

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);

export function ContainerSongstats({ companyId, artistId }: { companyId: string; artistId: string }) {
  const [data, setData] = useState<SongstatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data: payload, error } = await supabase.rpc("rpc_artist_songstats_full", {
        _company_id: companyId, _artist_id: artistId, _top_geo_limit: 10, _top_tracks_limit: 10, _events_limit: 15,
      });
      if (error) setErr(error.message); else setData(payload as SongstatsPayload);
      setLoading(false);
    })();
  }, [companyId, artistId]);

  if (loading) {
    return <div className="rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 text-slate-600 dark:text-slate-300 flex items-center gap-2"><Loader2 className="animate-spin" /> <span>Chargement Songstats…</span></div>;
  }
  if (err) return <div className="rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 text-red-600 dark:text-red-300">Erreur Songstats : {err}</div>;
  if (!data) return null;

  const s = data.stats || {};
  const geo = Array.isArray(data.geo) ? data.geo : [];
  const tracks = Array.isArray(data.tracks) ? data.tracks : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const info = data.info || {};

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="text-slate-800 dark:text-slate-200 font-medium">Songstats</div>
        {info.artist_spotify_url && (
          <a href={info.artist_spotify_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <LinkIcon size={14} /> Spotify
          </a>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* KPIs */}
        <div className="xl:col-span-1 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">Spotify followers</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{s.spotify_followers?.toLocaleString?.() ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">Monthly listeners</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{s.spotify_monthly_listeners?.toLocaleString?.() ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">Instagram</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{s.instagram_followers?.toLocaleString?.() ?? "—"}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Dernière MAJ stats : {s.last_stats_updated_at ? new Date(s.last_stats_updated_at).toLocaleString() : "—"}</div>
        </div>

        {/* Audience GEO */}
        <div className="xl:col-span-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2"><Globe2 size={16} /><span className="text-sm font-medium">Audience (Top pays)</span></div>
          {geo.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucune donnée d'audience.</div> : (
            <div className="flex flex-wrap gap-2">
              {geo.map((g, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  {g.country_code} · {g.audience_count?.toLocaleString?.() ?? g.audience_count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Top Tracks */}
        <div className="xl:col-span-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2"><Music2 size={16} /><span className="text-sm font-medium">Top tracks</span></div>
          {tracks.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucune track disponible.</div> : (
            <ul className="space-y-1">
              {tracks.map((t, i) => (
                <li key={i} className="text-sm text-slate-800 dark:text-slate-200">#{t.rank} — {t.name}{t.popularity != null ? <span className="text-slate-500 dark:text-slate-400"> · pop {t.popularity}</span> : null}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Toutes les métriques (Songstats) */}
        <div className="xl:col-span-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
          <div className="text-slate-700 dark:text-slate-300 mb-2 text-sm font-medium">Toutes les métriques (Songstats)</div>
          {!data.stats_all || Object.keys(data.stats_all).length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Aucune métrique enregistrée.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Object.entries(data.stats_all).map(([source, metrics]) => (
                <div key={source} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-100 dark:bg-slate-950/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{source}</div>
                  <ul className="space-y-1">
                    {Object.entries(metrics).map(([metric, obj]) => (
                      <li key={metric} className="text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                        <span className="truncate">{metric}</span>
                        <span className="text-slate-900 dark:text-slate-100">{(obj as any).value?.toLocaleString?.() ?? (obj as any).value}{(obj as any).unit ? <span className="text-slate-500 dark:text-slate-400 text-xs"> {(obj as any).unit}</span> : null}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events (full width) */}
        <div className="xl:col-span-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2"><CalendarDays size={16} /><span className="text-sm font-medium">Événements</span></div>
          {events.length === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400">Aucun événement à venir.</div> : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {events.map((e, i) => (
                <li key={i} className="text-sm text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-white dark:bg-slate-900/40">
                  <div className="text-slate-900 dark:text-slate-100">{e.date ?? "TBA"}</div>
                  <div className="text-slate-700 dark:text-slate-300">{e.city ?? "—"}, {e.country ?? "—"} {e.venue ? `· ${e.venue}` : ""}</div>
                  {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Ouvrir</a>}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">Dernière MAJ globale : {info.last_updated_any ? new Date(info.last_updated_any).toLocaleString() : "—"}</div>
        </div>
      </div>
    </div>
  );
}

