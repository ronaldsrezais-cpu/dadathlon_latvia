import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

const RACE_ID_URL = "https://raceid.com/en/races/14911/about";
const RACE_ID_RULES_URL = "https://raceid.com/en/races/14911/information";
const FULL_RULES_URL = "/Global_Dadathlon_2026_Latvijas_balvas_izlozes_nolikums.docx";

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
              Skrieniet, brauciet ar velosipēdu un dodieties pārgājienā kopā ar bērnu — sev ērtā laikā un vietā.
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
            <div className="virtual-badges" aria-label="Svarīgākā informācija">
              <span>Bez maksas</span>
              <span>Līdz 30.09.2026. plkst. 23.59</span>
              <span>Tēvs + vismaz 1 bērns</span>
            </div>
            <p className="section-kicker">Piedalies no jebkuras vietas</p>
            <h2>Global Dadathlon 2026</h2>
            <p>
              Lai pabeigtu virtuālo izaicinājumu, tēvam kopā ar vismaz vienu bērnu jāveic visas trīs aktivitātes:
              <strong> skriešana, riteņbraukšana un pārgājiens vai iešana</strong>. Aktivitātes var veikt vienā dienā vai dažādās dienās,
              jebkurā jums ērtā vietā. Sportiskais rezultāts vai ātrums nav galvenais — svarīgākais ir kustēties kopā.
            </p>
            <div className="virtual-inline-actions">
              <a
                href={RACE_ID_URL}
                target="_blank"
                rel="noreferrer"
                className="primary-button virtual-primary-link"
              >
                Atvērt izaicinājumu RaceID ↗
              </a>
              <a href="#nolikums" className="virtual-text-link">Skatīt galvenos noteikumus ↓</a>
            </div>
          </section>

          <section className="virtual-section-card" aria-labelledby="activities-title">
            <div className="virtual-section-heading">
              <div>
                <p className="section-kicker">3 aktivitātes</p>
                <h2 id="activities-title">Izvēlieties savu distances līmeni</h2>
              </div>
              <p>Vienu līmeni izvēlas visam izaicinājumam.</p>
            </div>

            <div className="virtual-activity-row" aria-label="Izaicinājuma aktivitātes">
              <div className="virtual-activity-pill"><span aria-hidden="true">🏃</span><strong>Skriešana</strong></div>
              <div className="virtual-activity-pill"><span aria-hidden="true">🚲</span><strong>Riteņbraukšana</strong></div>
              <div className="virtual-activity-pill"><span aria-hidden="true">🥾</span><strong>Pārgājiens / iešana</strong></div>
            </div>

            <div className="virtual-distance-table-wrap">
              <table className="virtual-distance-table">
                <thead>
                  <tr>
                    <th>Līmenis</th>
                    <th>Skriešana</th>
                    <th>Riteņbraukšana</th>
                    <th>Pārgājiens / iešana</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th>Bronze</th><td>1 km</td><td>3 km</td><td>1 km</td></tr>
                  <tr><th>Silver</th><td>3 km</td><td>5 km</td><td>2 km</td></tr>
                  <tr><th>Gold</th><td>7 km</td><td>10 km</td><td>3 km</td></tr>
                </tbody>
              </table>
            </div>
            <p className="virtual-soft-note">
              Bērniem nav noteikts minimālais vai maksimālais vecums. Droši drīkst izmantot bērnu ratiņus, velosēdeklīti vai piekabi,
              kā arī bērnu nesēju, ievērojot attiecīgās drošības prasības.
            </p>
          </section>

          <section className="virtual-rules-section" id="nolikums" aria-labelledby="rules-title">
            <div className="virtual-rules-heading">
              <div>
                <p className="section-kicker">Latvijas dalībniekiem</p>
                <h2 id="rules-title">Galvenais par Latvijas balvu izlozi</h2>
              </div>
              <a href={FULL_RULES_URL} className="virtual-rules-download" download>
                Lejupielādēt pilno nolikumu ↓
              </a>
            </div>
            <p className="virtual-rules-intro">
              Zemāk ir īss Latvijas dalībnieku balvu izlozes nolikuma kopsavilkums. Starptautiskā virtuālā izaicinājuma norisei
              papildus piemērojami arī RaceID publicētie <a href={RACE_ID_RULES_URL} target="_blank" rel="noreferrer">Global Dadathlon 2026 noteikumi ↗</a>.
            </p>

            <div className="virtual-rule-grid">
              <article className="virtual-rule-card">
                <div className="virtual-card-icon" aria-hidden="true">⏱️</div>
                <h3>Termiņš</h3>
                <p>
                  Latvijas balvu izlozei visas trīs aktivitātes jāizpilda un rezultāti RaceID jāaugšupielādē līdz
                  <strong> 2026. gada 30. septembra plkst. 23.59</strong>. Aktivitātes drīkst būt veiktas arī pirms 1. septembra.
                </p>
              </article>

              <article className="virtual-rule-card">
                <div className="virtual-card-icon" aria-hidden="true">📱</div>
                <h3>Rezultātu reģistrēšana</h3>
                <p>
                  Aktivitātes reģistrē pieaugušais dalībnieks — tēvs — ar sporta lietotni, GPS viedpulksteni vai citu ierīci,
                  kas fiksē veikto distanci, un rezultātus augšupielādē RaceID.
                </p>
              </article>

              <article className="virtual-rule-card virtual-rule-card--accent">
                <div className="virtual-card-icon" aria-hidden="true">📸</div>
                <h3>Lai piedalītos Latvijas balvu izlozē</h3>
                <ul className="virtual-checklist">
                  <li>dalībniekam jābūt vismaz 18 gadus vecam, pastāvīgi jādzīvo Latvijā un RaceID jābūt reģistrētam kā dalībniekam no Latvijas;</li>
                  <li>kopā ar vismaz vienu bērnu jāizpilda visas trīs aktivitātes izvēlētajā distances līmenī;</li>
                  <li>publiski pieejamā sociālo mediju profilā jāpublicē foto un/vai video no dalības izaicinājumā;</li>
                  <li>publikācijā jāatzīmē <strong>@daddyhood_official</strong> un <strong>@lsfp.lv</strong> un jāizmanto <strong>#DaddyHoodDadathlon</strong>;</li>
                  <li>vienā vai vairākās publikācijās jābūt atspoguļotām visām trim aktivitātēm.</li>
                </ul>
                <p className="virtual-privacy-note">
                  Bērna seja, vārds vai cita identificējoša informācija nav jāpublicē. Publikācijai jāpaliek publiski pieejamai līdz Latvijas balvu izlozes rezultātu paziņošanai.
                </p>
              </article>

              <article className="virtual-rule-card virtual-rule-card--prize">
                <div className="virtual-card-icon" aria-hidden="true">🎁</div>
                <h3>Latvijas balvas</h3>
                <p className="virtual-prize-number">3 × ģimenes balva</p>
                <p>
                  Tiks izlozētas <strong>trīs vienādas balvas</strong>. Katrā balvā — <strong>4 Līvu Akvaparka dienas biļetes</strong>.
                  Vismaz vienam no četriem balvas izmantotājiem jābūt bērnam, ar kuru uzvarētājs piedalījies izaicinājumā.
                </p>
                <p>
                  Uzvarētājus nosaka nejaušā elektroniskā izlozē ne vēlāk kā piecu darbdienu laikā pēc 30. septembra termiņa.
                  Izvēlētais līmenis un sportiskais rezultāts izredzes izlozē neietekmē.
                </p>
              </article>
            </div>
          </section>

          <section className="virtual-grid virtual-info-grid">
            <article className="virtual-card">
              <div className="virtual-card-icon" aria-hidden="true">✅</div>
              <p className="section-kicker">Kā piedalīties</p>
              <h2>Daži vienkārši soļi</h2>
              <ol className="virtual-steps">
                <li>Atveriet Global Dadathlon 2026 izaicinājumu RaceID un reģistrējieties.</li>
                <li>Izvēlieties Bronze, Silver vai Gold līmeni.</li>
                <li>Kopā ar vismaz vienu bērnu veiciet visas trīs aktivitātes un reģistrējiet distances.</li>
                <li>Augšupielādējiet visu trīs aktivitāšu rezultātus RaceID līdz 30. septembra plkst. 23.59.</li>
                <li>Ja vēlaties piedalīties Latvijas balvu izlozē, izpildiet arī sociālo mediju publikācijas nosacījumus.</li>
              </ol>
            </article>

            <article className="virtual-card">
              <div className="virtual-card-icon" aria-hidden="true">🌍</div>
              <p className="section-kicker">Atsevišķi no Latvijas izlozes</p>
              <h2>Starptautiskā balva</h2>
              <p>
                Global Dadathlon 2026 starptautiskā balva ir ceļojums uz Prāgu 2027. gada aprīlī, lai apmeklētu DaddyHood konferenci
                un klātienes Dadathlon pasākumu. Tā <strong>nav Latvijas balvu izlozes sastāvdaļa</strong> — saņēmēju nosaka starptautiskie
                koordinatori saskaņā ar starptautiskajiem noteikumiem, izvērtējot iedvesmojošos sociālo mediju stāstus un publikācijas.
              </p>
            </article>
          </section>

          <section className="virtual-support-card">
            <div>
              <p className="section-kicker">Jautājumi</p>
              <h2>Kur vērsties?</h2>
            </div>
            <div className="virtual-support-columns">
              <div>
                <strong>Par RaceID un tehniskiem jautājumiem</strong>
                <a href="mailto:info@daddyhoodeurope.com">info@daddyhoodeurope.com</a>
              </div>
              <div>
                <strong>Par Latvijas balvu izlozi</strong>
                <a href="mailto:lsfp@lsfp.lv">lsfp@lsfp.lv</a>
              </div>
            </div>
          </section>

          <section className="virtual-raceid-card">
            <div>
              <p className="section-kicker">RaceID</p>
              <h2>Gatavi izaicinājumam?</h2>
              <p>Pievienojieties Global Dadathlon 2026 un kustieties kopā ar bērnu.</p>
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
