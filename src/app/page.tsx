"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Database,
  Filter,
  Layers3,
  Loader2,
  Map,
  MapPin,
  Radar,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { categoryColors, compactNumber, getAverageRating, popularityTier, seedPlaces } from "@/lib/places";
import type { DistrictArea, Place, PlaceCategory } from "@/lib/types";

type SyncState = "idle" | "syncing" | "synced" | "failed";

const categories: Array<"All" | PlaceCategory> = [
  "All",
  "Food & Nightlife",
  "Shopping",
  "Campus & Education",
  "Sports & Fitness",
  "Recreation",
  "Services",
  "Navigation"
];

const areas: Array<"All" | DistrictArea> = [
  "All",
  "District 1 Core",
  "District 7 / Tan Hung",
  "Binh Hung",
  "Citywide / Other"
];

const popularityTiers = ["All", "Landmark", "Popular", "Known", "Niche"] as const;

function numberOrZero(value?: number) {
  return typeof value === "number" ? value : 0;
}

function categoryLabelColor(category: PlaceCategory) {
  return categoryColors[category] ?? "#16d9ff";
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; payload?: unknown }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#071024]/95 px-3 py-2 text-xs text-slate-100 shadow-2xl">
      {label ? <div className="mb-1 font-semibold text-white">{label}</div> : null}
      {payload.map((item) => (
        <div key={`${item.name}-${item.value}`} className="text-slate-300">
          {item.name}: <span className="font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function Header({ onSync, placeCount, syncState, syncedAt }: { onSync: () => void; placeCount: number; syncState: SyncState; syncedAt?: string }) {
  return (
    <header className="glass relative overflow-hidden rounded-[28px] p-5 md:p-7">
      <div className="absolute inset-0 atlas-grid opacity-40" />
      <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-cyanPulse/20 blur-3xl" />
      <div className="absolute bottom-0 right-20 h-36 w-36 rounded-full bg-magentaPulse/20 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyanPulse/40 bg-cyanPulse/10 shadow-glow">
            <MapPin className="h-7 w-7 text-cyanPulse" />
            <Activity className="absolute right-2 top-2 h-4 w-4 text-limePulse" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyanPulse">
              <Sparkles className="h-4 w-4" />
              Ho Chi Minh recents atlas
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Maps Pulse Saigon</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              A live-feeling dashboard for the places you have been scouting: food, nightlife, shopping, campuses,
              sports fields, and the District 7 routes that keep showing up in your map trail.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:min-w-64">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Database className="h-4 w-4 text-amberPulse" />
            Places API enrichment
          </div>
          <button
            onClick={onSync}
            disabled={syncState === "syncing"}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyanPulse px-4 py-3 text-sm font-bold text-ink transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
          >
            {syncState === "syncing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {syncState === "syncing" ? "Syncing places" : "Sync places"}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            {syncState === "synced" && syncedAt ? `Synced ${new Date(syncedAt).toLocaleTimeString()}` : null}
            {syncState === "failed" ? "Sync failed. Showing cached seed data." : null}
            {syncState === "idle" ? `Seeded from the current ${placeCount} visible Ho Chi Minh City places in the seed.` : null}
          </p>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, hint, color }: { icon: typeof MapPin; label: string; value: string; hint: string; color: string }) {
  return (
    <article className="glass rounded-2xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5" style={{ color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </article>
  );
}

function Filters({
  category,
  setCategory,
  area,
  setArea,
  tier,
  setTier,
  minRating,
  setMinRating,
  query,
  setQuery
}: {
  category: "All" | PlaceCategory;
  setCategory: (value: "All" | PlaceCategory) => void;
  area: "All" | DistrictArea;
  setArea: (value: "All" | DistrictArea) => void;
  tier: (typeof popularityTiers)[number];
  setTier: (value: (typeof popularityTiers)[number]) => void;
  minRating: number;
  setMinRating: (value: number) => void;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Filter className="h-4 w-4 text-cyanPulse" />
        Signal filters
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search places"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none ring-cyanPulse/30 placeholder:text-slate-500 focus:ring-4"
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value as "All" | PlaceCategory)} className="h-11 rounded-xl border border-white/10 bg-[#071024] px-3 text-sm text-white outline-none">
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={area} onChange={(event) => setArea(event.target.value as "All" | DistrictArea)} className="h-11 rounded-xl border border-white/10 bg-[#071024] px-3 text-sm text-white outline-none">
          {areas.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={tier} onChange={(event) => setTier(event.target.value as (typeof popularityTiers)[number])} className="h-11 rounded-xl border border-white/10 bg-[#071024] px-3 text-sm text-white outline-none">
          {popularityTiers.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-300">
          <Star className="h-4 w-4 text-amberPulse" />
          <span className="whitespace-nowrap">{minRating.toFixed(1)}+</span>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={minRating}
            onChange={(event) => setMinRating(Number(event.target.value))}
            className="w-full accent-cyanPulse"
          />
        </label>
      </div>
    </section>
  );
}

function CityClusterMap({ places }: { places: Place[] }) {
  const plotted = places.filter((place) => typeof place.lat === "number" && typeof place.lng === "number");
  const minLat = 10.72;
  const maxLat = 10.815;
  const minLng = 106.64;
  const maxLng = 106.81;

  return (
    <section className="glass relative min-h-[390px] overflow-hidden rounded-2xl p-5">
      <div className="absolute inset-0 atlas-grid opacity-40" />
      <div className="absolute left-1/2 top-0 h-full w-12 -translate-x-1/2 rotate-12 bg-cyanPulse/10 blur-xl" />
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">City clusters</h2>
          <p className="text-sm text-slate-400">District 1 energy vs District 7 habit loops</p>
        </div>
        <Radar className="h-5 w-5 text-limePulse" />
      </div>
      <div className="relative z-10 h-[300px] rounded-2xl border border-white/10 bg-black/25">
        <div className="absolute left-[68%] top-[28%] rounded-full border border-magentaPulse/50 bg-magentaPulse/10 px-3 py-1 text-xs font-semibold text-magentaPulse">
          District 1 Core
        </div>
        <div className="absolute left-[18%] top-[62%] rounded-full border border-limePulse/50 bg-limePulse/10 px-3 py-1 text-xs font-semibold text-limePulse">
          District 7 / Tan Hung
        </div>
        {plotted.map((place) => {
          const x = Math.min(96, Math.max(4, (((place.lng ?? minLng) - minLng) / (maxLng - minLng)) * 100));
          const y = Math.min(96, Math.max(4, (1 - (((place.lat ?? minLat) - minLat) / (maxLat - minLat))) * 100));
          const size = Math.min(26, Math.max(8, Math.log10((place.userRatingCount ?? 10) + 10) * 6));
          return (
            <div
              key={place.id}
              title={`${place.name} - ${place.category}`}
              className="absolute rounded-full border border-white/70 shadow-glow transition hover:scale-150"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                backgroundColor: categoryLabelColor(place.category),
                opacity: 0.82,
                transform: "translate(-50%, -50%)"
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function Insights({ places }: { places: Place[] }) {
  const districtSeven = places.filter((place) => place.districtArea === "District 7 / Tan Hung").length;
  const foodReviews = places
    .filter((place) => place.category === "Food & Nightlife")
    .reduce((sum, place) => sum + numberOrZero(place.userRatingCount), 0);
  const shoppingReviews = places
    .filter((place) => place.category === "Shopping")
    .reduce((sum, place) => sum + numberOrZero(place.userRatingCount), 0);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="glass rounded-2xl p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-limePulse/10 text-limePulse">
          <Map className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-white">District 7 is the base layer</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {districtSeven} visible places sit around Tan Hung, RMIT, Ton Duc Thang, and nearby routes, so the data reads like living-area scouting.
        </p>
      </article>
      <article className="glass rounded-2xl p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-magentaPulse/10 text-magentaPulse">
          <TrendingUp className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-white">Food and retail carry the crowd signal</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Food/nightlife accounts for {compactNumber(foodReviews)} reviews, while shopping adds {compactNumber(shoppingReviews)} more, led by Ben Thanh and Vincom.
        </p>
      </article>
      <article className="glass rounded-2xl p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyanPulse/10 text-cyanPulse">
          <Layers3 className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-white">The searches mix utility and taste</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          The set blends routes, schools, courts, gyms, restaurants, and markets, which is perfect for a dashboard about actual city behavior.
        </p>
      </article>
    </section>
  );
}

export default function Home() {
  const [places, setPlaces] = useState<Place[]>(seedPlaces);
  const [category, setCategory] = useState<"All" | PlaceCategory>("All");
  const [area, setArea] = useState<"All" | DistrictArea>("All");
  const [tier, setTier] = useState<(typeof popularityTiers)[number]>("All");
  const [minRating, setMinRating] = useState(0);
  const [query, setQuery] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncedAt, setSyncedAt] = useState<string>();

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return places.filter((place) => {
      const matchesCategory = category === "All" || place.category === category;
      const matchesArea = area === "All" || place.districtArea === area;
      const matchesTier = tier === "All" || popularityTier(place) === tier;
      const matchesRating = (place.rating ?? 0) >= minRating;
      const matchesQuery =
        !normalizedQuery ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.category.toLowerCase().includes(normalizedQuery) ||
        (place.address ?? "").toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesArea && matchesTier && matchesRating && matchesQuery;
    });
  }, [area, category, minRating, places, query, tier]);

  const categoryData = useMemo(() => {
    return categories
      .filter((item): item is PlaceCategory => item !== "All")
      .map((item) => ({
        name: item,
        value: filteredPlaces.filter((place) => place.category === item).length,
        color: categoryLabelColor(item)
      }))
      .filter((item) => item.value > 0);
  }, [filteredPlaces]);

  const areaData = useMemo(() => {
    return areas
      .filter((item): item is DistrictArea => item !== "All")
      .map((item) => ({
        name: item.replace("District ", "D"),
        places: filteredPlaces.filter((place) => place.districtArea === item).length
      }))
      .filter((item) => item.places > 0);
  }, [filteredPlaces]);

  const scatterData = useMemo(
    () =>
      filteredPlaces
        .filter((place) => typeof place.rating === "number" && typeof place.userRatingCount === "number")
        .map((place) => ({
          id: place.id,
          name: place.name,
          rating: place.rating,
          reviews: place.userRatingCount,
          category: place.category
        })),
    [filteredPlaces]
  );

  const leaderboard = useMemo(
    () => [...filteredPlaces].sort((a, b) => numberOrZero(b.userRatingCount) - numberOrZero(a.userRatingCount)).slice(0, 8),
    [filteredPlaces]
  );

  const totalReviews = filteredPlaces.reduce((sum, place) => sum + numberOrZero(place.userRatingCount), 0);
  const averageRating = getAverageRating(filteredPlaces);
  const topCategory = categoryData[0]?.name ?? "No category";
  const syncedCount = places.filter((place) => place.source === "places-api").length;

  async function syncPlaces() {
    setSyncState("syncing");
    try {
      const response = await fetch("/api/places/sync", { method: "POST" });
      if (!response.ok) throw new Error("Sync failed");
      const payload = (await response.json()) as { places: Place[]; syncedAt: string };
      setPlaces(payload.places);
      setSyncedAt(payload.syncedAt);
      setSyncState("synced");
    } catch {
      setSyncState("failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
      <Header onSync={syncPlaces} placeCount={places.length} syncState={syncState} syncedAt={syncedAt} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MapPin} label="Visible HCMC places" value={String(filteredPlaces.length)} hint={`${places.length} total places in the current seed`} color="#16d9ff" />
        <StatCard icon={Star} label="Average rating" value={averageRating ? averageRating.toFixed(2) : "N/A"} hint="Filtered set, excluding unrated places" color="#ffb020" />
        <StatCard icon={TrendingUp} label="Review volume" value={compactNumber(totalReviews)} hint="Popularity proxy from Google Maps reviews" color="#ff3bbd" />
        <StatCard icon={RefreshCcw} label="API enriched" value={`${syncedCount}/${places.length}`} hint="Manual sync upgrades seed records with Places API" color="#82f52c" />
      </section>

      <Filters
        category={category}
        setCategory={setCategory}
        area={area}
        setArea={setArea}
        tier={tier}
        setTier={setTier}
        minRating={minRating}
        setMinRating={setMinRating}
        query={query}
        setQuery={setQuery}
      />

      <Insights places={filteredPlaces} />

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="glass min-h-[340px] rounded-2xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Category pulse</h2>
                <p className="text-sm text-slate-400">What kind of places dominate the trail</p>
              </div>
              <BarChart3 className="h-5 w-5 text-cyanPulse" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={5}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryData.map((entry) => (
                <span key={entry.name} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}: {entry.value}
                </span>
              ))}
            </div>
          </article>

          <article className="glass min-h-[340px] rounded-2xl p-5">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">Area split</h2>
              <p className="text-sm text-slate-400">The city zones showing up most often</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={areaData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="places" radius={[8, 8, 2, 2]} fill="#16d9ff" />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="glass min-h-[360px] rounded-2xl p-5 lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">Rating vs popularity</h2>
              <p className="text-sm text-slate-400">High review count shows durable crowd signal; high rating shows delight.</p>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <ScatterChart margin={{ top: 10, right: 12, bottom: 10, left: -14 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" dataKey="rating" name="Rating" domain={[3.4, 5.1]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="reviews" name="Reviews" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => compactNumber(Number(value))} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
                <Scatter data={scatterData} fill="#ff3bbd">
                  {scatterData.map((entry) => (
                    <Cell key={entry.id} fill={categoryLabelColor(entry.category as PlaceCategory)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </article>
        </div>

        <div className="grid gap-5">
          <CityClusterMap places={filteredPlaces} />
          <article className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Popularity leaderboard</h2>
                <p className="text-sm text-slate-400">Ranked by Google Maps review count</p>
              </div>
              <TrendingUp className="h-5 w-5 text-magentaPulse" />
            </div>
            <div className="space-y-3">
              {leaderboard.map((place, index) => (
                <div key={place.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-sm font-black text-white">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{place.name}</p>
                    <p className="text-xs text-slate-500">{place.category} · {popularityTier(place)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cyanPulse">{compactNumber(numberOrZero(place.userRatingCount))}</p>
                    <p className="text-xs text-slate-500">reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Place intelligence</h2>
            <p className="text-sm text-slate-400">Filtered places, categories, crowd signal, and direct Maps links</p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            Top category: <span className="font-semibold text-white">{topCategory}</span>
          </div>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Place</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Area</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Reviews</th>
                <th className="px-5 py-4">Signal</th>
                <th className="px-5 py-4">Maps</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlaces.map((place) => (
                <tr key={place.id} className="border-t border-white/5">
                  <td className="max-w-[280px] px-5 py-4">
                    <div className="font-semibold text-white">{place.name}</div>
                    <div className="truncate text-xs text-slate-500">{place.address ?? place.types.join(", ")}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold text-ink" style={{ backgroundColor: categoryLabelColor(place.category) }}>
                      {place.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{place.districtArea}</td>
                  <td className="px-5 py-4 text-white">{place.rating ? place.rating.toFixed(1) : "N/A"}</td>
                  <td className="px-5 py-4 text-cyanPulse">{place.userRatingCount ? compactNumber(place.userRatingCount) : "N/A"}</td>
                  <td className="px-5 py-4 text-slate-300">{popularityTier(place)}</td>
                  <td className="px-5 py-4">
                    {place.googleMapsUri ? (
                      <a href={place.googleMapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-cyanPulse hover:text-cyanPulse">
                        Open <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">After sync</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
