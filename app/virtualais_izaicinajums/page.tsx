import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

const RACE_ID_URL = "https://raceid.com/en/races/14911/about";

export default function VirtualChallengePage() {
  return (
    <>
      <header className="site-header virtual-hero">
        <div className="shell header-inner virtual-header-inner">
          <Link href="/" className="brand-link" aria-label="Dadathlon Latvija sākumlapa">
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
            <p className="eyebrow">Dadathlon Latvija</p>
            <h1>Virtuālais izaicinājums</h1>
            <p className="event-meta">
              Kustieties kopā ar bērnu sev ērtā laikā un vietā un pievienojiet savu rezultātu RaceID.
            </p>
            <div className="header-actions">
              <a
                href={RACE_ID_URL}
                target="_blank"
                rel="noreferrer"
                className="header-cta header-cta--raceid"
              >
                Piedalīties izaicinājumā
              </a>
              <Link href="/" className="header-cta header-cta--virtual">
                Klātienes pasākums
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="virtual-main">
        <div className="shell virtual-shell">
          <section className="virtual-intro-card">
            <p className="section-kicker">Piedalies no jebkuras vietas</p>
            <h2>Dadathlon virtuālais izaicinājums</h2>
            <p>
              Arī tad, ja nevarat būt kopā ar mums Jelgavā, Dadathlon iespējams piedzīvot attālināti.
              Tēvi un bērni var kopā skriet, braukt ar velosipēdu vai doties pārgājienā, reģistrēt savu
              aktivitāti un pievienot rezultātu RaceID izaicinājumā.
            </p>
            <a
              href={RACE_ID_URL}
              target="_blank"
              rel="noreferrer"
              className="primary-button virtual-primary-link"
            >
              Atvērt izaicinājumu RaceID ↗
            </a>
          </section>

          <section className="virtual-grid">
            <article className="virtual-card" id="nolikums">
              <div className="virtual-card-icon" aria-hidden="true">📄</div>
              <p className="section-kicker">Noteikumi</p>
              <h2>Izaicinājuma nolikums</h2>
              <p className="virtual-placeholder">
                Šī sadaļa ir sagatavota izaicinājuma nolikumam. Pirms lapas publiskas palaišanas šeit
                jāievieto apstiprinātais nolikuma teksts vai saite uz nolikuma PDF failu.
              </p>
            </article>

            <article className="virtual-card">
              <div className="virtual-card-icon" aria-hidden="true">🏃</div>
              <p className="section-kicker">Kā piedalīties</p>
              <h2>Daži vienkārši soļi</h2>
              <ol className="virtual-steps">
                <li>Atveriet Dadathlon izaicinājumu RaceID un reģistrējieties vai piesakieties savā kontā.</li>
                <li>Kopā ar bērnu veiciet izvēlēto aktivitāti un reģistrējiet to ar pulksteni vai lietotni.</li>
                <li>RaceID sadaļā <strong>My results → Virtual Races</strong> pievienojiet savu rezultātu.</li>
                <li>Saglabājiet rezultātu — tas parādīsies publiskajā rezultātu sarakstā.</li>
              </ol>
            </article>
          </section>

          <section className="virtual-raceid-card">
            <div>
              <p className="section-kicker">RaceID</p>
              <h2>Gatavi izaicinājumam?</h2>
              <p>Pārejiet uz Dadathlon virtuālā izaicinājuma lapu un pievienojieties.</p>
            </div>
            <a
              href={RACE_ID_URL}
              target="_blank"
              rel="noreferrer"
              className="primary-button virtual-primary-link"
            >
              Doties uz RaceID ↗
            </a>
          </section>
        </div>
      </main>

      <Footer hideOrganizer hideEventInfo />
    </>
  );
}
