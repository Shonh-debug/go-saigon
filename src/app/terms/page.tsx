import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-cyanPulse">
        Go Saigon
      </Link>
      <article className="glass mt-6 rounded-lg p-6 md:p-9">
        <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-400">Effective May 26, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Destination discovery</h2>
            <p className="mt-2">
              Go Saigon provides visitor-oriented discovery results for familiar Ho Chi Minh City district
              areas. Rankings are based on the live Google Places candidates retrieved for a search, ordered by
              review count and then rating; they are not a guarantee of an exhaustive citywide ranking.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Area labels and map data</h2>
            <p className="mt-2">
              Familiar district labels and boundary overlays reflect a 2020 visitor-area model and are provided for
              trip planning, not current administrative or legal use. Boundary data is from geoBoundaries VNM ADM2
              (OCHA ROAP / Government of Viet Nam), licensed under CC BY 3.0 IGO.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Google terms</h2>
            <p className="mt-2">
              Place data, photos, map imagery, and destination links are provided by Google Maps Platform. Use of
              this content is subject to the{" "}
              <a className="text-cyanPulse" href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noreferrer">
                Google Maps/Google Earth Additional Terms of Service
              </a>{" "}
              and the{" "}
              <a className="text-cyanPulse" href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
                Google Terms of Service
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
