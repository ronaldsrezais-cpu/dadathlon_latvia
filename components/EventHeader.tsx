import Image from "next/image";
import Link from "next/link";

export default function EventHeader({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <header className={`site-header ${compact ? "site-header--compact" : ""}`}>
        <div className="shell header-inner">
          <Link href="/" className="brand-link" aria-label="Dadathlon sākumlapa">
            <Image
              src="/dadathlon-logo.png"
              width={360}
              height={261}
              alt="Dadathlon"
              priority
              className="brand-logo"
            />
          </Link>
          <div className="header-copy">
            <p className="eyebrow">Tēviem un bērniem</p>
            <h1>{compact ? "Pieteikuma labošana" : "Dadathlon Latvija"}</h1>
            <p className="event-meta">12. septembris · 10:30–13:00 · Pasta sala, Jelgava</p>
            {!compact && <a href="#registracija" className="header-cta">Reģistrēties</a>}
          </div>
        </div>
      </header>
      {!compact && (
        <section className="event-strip" aria-label="Pasākuma informācija">
          <div className="shell event-strip-grid">
            <div><span>📍</span><strong>Pasta sala</strong><small>Jelgava</small></div>
            <div><span>📅</span><strong>12.09.2026.</strong><small>10:30–13:00</small></div>
            <div><span>🏃</span><strong>Distance: 1 km</strong><small>Skrējiens ar uzdevumiem</small></div>
            <div><span>👨‍👧‍👦</span><strong>Tēvi + bērni</strong><small>Kopā kustībā</small></div>
          </div>
        </section>
      )}
    </>
  );
}
