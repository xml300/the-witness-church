import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/src/components/pages/PageShell";
import type { ChurchLocation, SiteContent } from "@/src/lib/content/types";

function LocationCard({ loc }: { loc: ChurchLocation }) {
  const online = loc.kind === "online";
  return (
    <li className="bg-white border border-gray-2 rounded-2xl p-6 flex flex-col">
      <span
        className={`self-start text-[10px] font-bold tracking-[1.5px] uppercase px-3 py-1 rounded-full mb-4 ${
          online ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
        }`}
      >
        {online ? "Online" : "In person"}
      </span>
      <h3 className="text-[20px] font-bold text-navy mb-2">{loc.name}</h3>
      {loc.address && <p className="text-[14px] text-text mb-1">{loc.address}</p>}
      {loc.schedule && <p className="text-[14px] text-muted">{loc.schedule}</p>}
      {loc.link && (
        <a
          href={loc.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 self-start text-[13px] font-semibold text-red hover:text-red-dark transition-colors"
        >
          {online ? "Watch service →" : "Get directions →"}
        </a>
      )}
    </li>
  );
}

export default function ConnectView({ content }: { content: SiteContent }) {
  const { locations, leaders, gallery } = content;
  const inPerson = locations.filter((l) => l.kind !== "online");
  const online = locations.filter((l) => l.kind === "online");

  return (
    <>
      <PageHeader
        tag="Join our community"
        title="Connect with Us"
        intro="Worship with us in person or from wherever you are. Find a service that fits your week."
      />

      <section className="px-6 md:px-12 lg:px-16 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-navy mb-6">In person</h2>
            {inPerson.length ? (
              <ul className="grid gap-5 md:grid-cols-2">
                {inPerson.map((l, i) => (
                  <LocationCard key={`${i}-${l.name}`} loc={l} />
                ))}
              </ul>
            ) : (
              <p className="text-muted">In-person locations are coming soon.</p>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-navy mb-6">Online</h2>
            {online.length ? (
              <ul className="grid gap-5 md:grid-cols-2">
                {online.map((l, i) => (
                  <LocationCard key={`${i}-${l.name}`} loc={l} />
                ))}
              </ul>
            ) : (
              <p className="text-muted">Online services are coming soon.</p>
            )}
          </div>
        </div>
      </section>

      {leaders.length > 0 && (
        <section className="bg-gray-bg px-6 md:px-12 lg:px-16 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-navy mb-2">Our leaders</h2>
            <p className="text-muted mb-8">The people who shepherd this church family.</p>
            <ul className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {leaders.map((l, i) => (
                <li key={`${i}-${l.name}`}>
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-2">
                    {l.photo && (
                      <Image
                        src={l.photo}
                        alt={l.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}
                  </div>
                  <p className="mt-3 text-[15px] font-bold text-navy">{l.name}</p>
                  {l.role && <p className="text-[13px] text-muted">{l.role}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-navy mb-2">Life at Witness</h2>
            <p className="text-muted mb-8">Moments from our services and events.</p>
            <ul className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {gallery.map((g, i) => (
                <li key={`${i}-${g.photo}`}>
                  <figure>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-2">
                      <Image
                        src={g.photo}
                        alt={g.caption || "Church life"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    {g.caption && (
                      <figcaption className="mt-2 text-[13px] text-muted">
                        {g.caption}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-navy text-white px-6 md:px-12 lg:px-16 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Not sure where to start?
        </h2>
        <p className="text-white/70 mb-6">
          Send a prayer request or see what is coming up.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/#prayer"
            className="bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark transition-colors"
          >
            Visit the prayer wall
          </Link>
          <Link
            href="/events"
            className="border border-white/40 text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            See upcoming events
          </Link>
        </div>
      </section>
    </>
  );
}
