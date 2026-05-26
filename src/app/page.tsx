"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Compass,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
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
import { DestinationMap } from "@/components/DestinationMap";
import type {
  CategoryId,
  Destination,
  DiscoveryOptionsResponse,
  DiscoverySearchResponse,
  VisitorAreaId
} from "@/lib/discovery/types";

const initialArea: VisitorAreaId = "district-1";
const initialCategory: CategoryId = "landmarks";
const palette = ["#16d9ff", "#ff3bbd", "#ffb020", "#82f52c", "#9b7cff", "#44d7a8"];

function compactNumber(value: number) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function readableType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#071024]/95 px-3 py-2 text-xs shadow-2xl">
      {label ? <p className="mb-1 font-semibold text-white">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="text-slate-300">
          {item.name}: <span className="font-semibold text-white">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color }: { icon: typeof MapPin; label: string; value: string; hint: string; color: string }) {
  return (
    <article className="glass rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <Icon className="h-5 w-5" style={{ color }} />
        <span className="h-1.5 w-12 rounded-full" style={{ background: color }} />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </article>
  );
}

function DestinationCard({ destination, rank }: { destination: Destination; rank: number }) {
  return (
    <a
      href={destination.googleMapsUri}
      target="_blank"
      rel="noreferrer"
      className="group grid grid-cols-[84px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyanPulse/60 hover:bg-cyanPulse/[0.06]"
    >
      <div className="relative h-[84px] overflow-hidden rounded-md bg-[#10203c]">
        {destination.photo ? (
          <Image src={destination.photo.proxyUrl} alt="" fill unoptimized className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="atlas-grid grid h-full place-items-center text-cyanPulse">
            <MapPin className="h-5 w-5" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded bg-ink/90 text-xs font-bold text-white">
          {rank}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold text-white">{destination.name}</p>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyanPulse" />
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">{destination.address ?? readableType(destination.types[0] ?? "Destination")}</p>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-amberPulse">
            <Star className="h-3 w-3 fill-current" />
            {destination.rating?.toFixed(1) ?? "N/A"}
          </span>
          <span className="text-slate-400">{compactNumber(destination.userRatingCount ?? 0)} reviews</span>
        </div>
        {destination.photo?.authorAttributions[0] ? (
          <p className="mt-1 truncate text-[10px] text-slate-500">
            Photo: {destination.photo.authorAttributions[0].displayName}
          </p>
        ) : null}
      </div>
    </a>
  );
}

export default function Home() {
  const canDisplayPlaces = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);
  const [options, setOptions] = useState<DiscoveryOptionsResponse>();
  const [selectedArea, setSelectedArea] = useState<VisitorAreaId>(initialArea);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(initialCategory);
  const [results, setResults] = useState<DiscoverySearchResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const explore = useCallback(async (areaId: VisitorAreaId, categoryId: CategoryId) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaId, categoryId })
      });
      const payload = (await response.json()) as DiscoverySearchResponse | { error: string };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Unable to discover destinations.");
      setResults(payload);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to discover destinations.");
      setResults(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/discovery/options")
      .then((response) => response.json())
      .then((payload: DiscoveryOptionsResponse) => setOptions(payload))
      .catch(() => setError("Unable to load discovery options."));
    if (canDisplayPlaces) {
      void explore(initialArea, initialCategory);
    } else {
      setLoading(false);
    }
  }, [canDisplayPlaces, explore]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canDisplayPlaces) void explore(selectedArea, selectedCategory);
  }

  const destinations = useMemo(() => results?.destinations ?? [], [results]);
  const totalReviews = destinations.reduce((sum, destination) => sum + (destination.userRatingCount ?? 0), 0);
  const rated = destinations.filter((destination) => typeof destination.rating === "number");
  const averageRating = rated.length
    ? rated.reduce((sum, destination) => sum + (destination.rating ?? 0), 0) / rated.length
    : 0;

  const topTypes = useMemo(() => {
    const counts = new Map<string, number>();
    destinations.forEach((destination) => {
      const type = destination.types[0] ?? "destination";
      counts.set(type, (counts.get(type) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([type, count]) => ({ name: readableType(type), value: count }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [destinations]);

  const ratingDistribution = useMemo(
    () =>
      ["Under 4.0", "4.0 - 4.4", "4.5+"].map((name, index) => ({
        name,
        count: destinations.filter((destination) => {
          const rating = destination.rating ?? 0;
          return index === 0 ? rating < 4 : index === 1 ? rating >= 4 && rating < 4.5 : rating >= 4.5;
        }).length
      })),
    [destinations]
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1580px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <header className="glass relative overflow-hidden rounded-lg px-5 py-5 md:px-7">
        <div className="atlas-grid absolute inset-0 opacity-35" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <Image src="/icon.png" width={60} height={60} alt="Maps Pulse Saigon" className="h-14 w-14 rounded-lg" />
            <div>
              <div className="flex items-center gap-2 text-xs uppercase text-cyanPulse">
                <Sparkles className="h-3.5 w-3.5" />
                Ho Chi Minh City visitor atlas
              </div>
              <h1 className="mt-1 text-2xl font-black text-white md:text-4xl">Maps Pulse Saigon</h1>
              <p className="mt-1 text-sm text-slate-400">Discover highly reviewed experiences across familiar city districts.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-limePulse" />
            Live destination data and photos provided by Google Maps
          </div>
        </div>
      </header>

      <form onSubmit={submit} className="glass grid gap-3 rounded-lg p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="text-xs font-semibold text-slate-400">
          Visitor area
          <select
            value={selectedArea}
            onChange={(event) => setSelectedArea(event.target.value as VisitorAreaId)}
            className="mt-2 block h-12 w-full rounded-md border border-white/10 bg-[#071024] px-3 text-sm text-white outline-none focus:border-cyanPulse"
          >
            {(options?.areas ?? [{ id: initialArea, label: "District 1" }]).map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Destination category
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value as CategoryId)}
            className="mt-2 block h-12 w-full rounded-md border border-white/10 bg-[#071024] px-3 text-sm text-white outline-none focus:border-cyanPulse"
          >
            {(options?.categories ?? [{ id: initialCategory, label: "Landmarks" }]).map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading || !canDisplayPlaces}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyanPulse px-7 text-sm font-bold text-ink transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Exploring" : "Explore"}
        </button>
      </form>

      {!canDisplayPlaces ? (
        <section className="rounded-lg border border-cyanPulse/30 bg-cyanPulse/10 px-5 py-4 text-sm text-slate-200">
          Configure `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` to enable public Google Maps destination discovery and map display.
        </section>
      ) : null}

      {error ? (
        <section className="rounded-lg border border-magentaPulse/30 bg-magentaPulse/10 px-5 py-4 text-sm text-slate-200">
          {error}
        </section>
      ) : null}

      <section className="no-scrollbar grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto sm:grid-flow-row sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MapPin} label="Destinations found" value={String(destinations.length)} hint="Top live results in this visitor area" color="#16d9ff" />
        <StatCard icon={Star} label="Average rating" value={averageRating ? averageRating.toFixed(2) : "N/A"} hint="Current displayed destinations" color="#ffb020" />
        <StatCard icon={TrendingUp} label="Review volume" value={compactNumber(totalReviews)} hint="Google review count signal" color="#ff3bbd" />
        <StatCard icon={Compass} label="Top destination" value={destinations[0]?.name ?? "--"} hint="Ranked by reviews, then rating" color="#82f52c" />
      </section>

      <section className="grid min-h-[590px] gap-4 xl:grid-cols-[1.65fr_0.85fr]">
        <article className="glass overflow-hidden rounded-lg">
          <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-white">{results?.area.label ?? "District 1"} map</h2>
              <p className="text-xs text-slate-400">Familiar district overlay with ranked Google Maps destinations</p>
            </div>
            <span className="text-xs text-slate-500">Boundary data: geoBoundaries/OCHA, CC BY 3.0 IGO</span>
          </div>
          <div className="h-[520px]">
            <DestinationMap areaId={results?.area.id ?? selectedArea} destinations={destinations} />
          </div>
        </article>

        <article className="glass flex max-h-[594px] flex-col rounded-lg">
          <div className="border-b border-white/10 px-4 py-4">
            <h2 className="font-bold text-white">Top destinations</h2>
            <p className="mt-1 text-xs text-slate-400">Ranked by Google review volume and rating</p>
            {results?.limitedResults ? (
              <p className="mt-2 text-xs text-amberPulse">Showing all qualifying destinations found for this selection.</p>
            ) : null}
          </div>
          <div className="no-scrollbar flex flex-col gap-3 overflow-y-auto p-3">
            {loading && !destinations.length ? <p className="p-6 text-center text-sm text-slate-400">Finding popular places...</p> : null}
            {destinations.map((destination, index) => (
              <DestinationCard key={destination.placeId} destination={destination} rank={index + 1} />
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Crowd signal</h2>
              <p className="text-xs text-slate-400">Review counts by destination</p>
            </div>
            <TrendingUp className="h-5 w-5 text-magentaPulse" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={destinations.slice(0, 7).map((destination) => ({ name: destination.name, reviews: destination.userRatingCount ?? 0 }))} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value) => compactNumber(Number(value))} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="reviews" fill="#ff3bbd" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="glass rounded-lg p-5">
          <div className="mb-4">
            <h2 className="font-bold text-white">Rating vs popularity</h2>
            <p className="text-xs text-slate-400">Current destination set</p>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <ScatterChart margin={{ left: -18, right: 8, top: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" dataKey="rating" domain={[3, 5]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis type="number" dataKey="reviews" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value) => compactNumber(Number(value))} />
              <Tooltip content={<ChartTooltip />} />
              <Scatter data={destinations.map((destination) => ({ rating: destination.rating ?? 0, reviews: destination.userRatingCount ?? 0 }))} fill="#16d9ff" />
            </ScatterChart>
          </ResponsiveContainer>
        </article>

        <article className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Experience mix</h2>
              <p className="text-xs text-slate-400">Types and ratings in this result set</p>
            </div>
            <BarChart3 className="h-5 w-5 text-cyanPulse" />
          </div>
          <div className="grid grid-cols-[1fr_130px] gap-2">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={topTypes} dataKey="value" nameKey="name" innerRadius={38} outerRadius={64} paddingAngle={4}>
                  {topTypes.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ratingDistribution}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 8 }} interval={0} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#82f52c" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTypes.map((entry, index) => (
              <span key={entry.name} className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                {entry.name}
              </span>
            ))}
          </div>
        </article>
      </section>

      <footer className="flex flex-col justify-between gap-3 border-t border-white/10 px-1 py-5 text-xs text-slate-500 md:flex-row">
        <p>Place data and photos provided by Google Maps. Familiar district boundaries represent the 2020 visitor-area model.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="hover:text-white">Google Maps</a>
        </div>
      </footer>
    </main>
  );
}
