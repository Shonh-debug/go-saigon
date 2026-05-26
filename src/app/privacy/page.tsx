import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-cyanPulse">
        Go Saigon
      </Link>
      <article className="glass mt-6 rounded-lg p-6 md:p-9">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Effective May 26, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">What this site processes</h2>
            <p className="mt-2">
              Go Saigon retrieves public destination information from Google Maps Platform when you select a
              visitor area and category. Results can include place names, locations, ratings, review counts, links,
              and photos for immediate display.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">What may be stored</h2>
            <p className="mt-2">
              The application may store Google place identifiers, selected area and category values, request times,
              and result counts to improve coverage and protect the service from abuse. It does not store Google
              ratings, review counts, addresses, photos, Maps links, or raw Places responses as a destination catalog.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Google Maps Platform</h2>
            <p className="mt-2">
              Destination information is provided by Google Maps. Your use of map and place content is also governed
              by the{" "}
              <a className="text-cyanPulse" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                Google Privacy Policy
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
