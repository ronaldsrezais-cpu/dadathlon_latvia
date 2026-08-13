import Image from "next/image";

const DISCLAIMER = "Līdzfinansē Eiropas Savienība. Tomēr paustie uzskati un viedokļi ir tikai autora(-u) uzskati un viedokļi un ne vienmēr atspoguļo Eiropas Savienības vai Eiropas Izglītības un kultūras izpildaģentūras (EACEA) uzskatus un viedokļus. Ne Eiropas Savienību, ne EACEA nevar saukt pie atbildības par tiem.";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <section className="organisation-section" aria-label="Pasākuma organizācijas">
          <div className="organisation-item">
            <p>Koordinē</p>
            <div className="organisation-logo-card">
              <Image src="/lsfp-logo.png" width={900} height={281} alt="Latvijas Sporta federāciju padome" className="organisation-logo organisation-logo--lsfp" />
            </div>
          </div>
          <div className="organisation-item">
            <p>Organizē</p>
            <div className="organisation-logo-card">
              <Image src="/jelgava-logo.png" width={986} height={488} alt="Jelgavas valstspilsētas pašvaldība" className="organisation-logo organisation-logo--jelgava" />
            </div>
          </div>
          <div className="organisation-item">
            <p>Partneri</p>
            <div className="organisation-logo-card organisation-logo-card--dark">
              <Image src="/daddyhood-logo-white.png" width={1000} height={1000} alt="DaddyHood Europe" className="organisation-logo organisation-logo--daddyhood" />
            </div>
          </div>
        </section>

        <section className="eu-section">
          <div className="eu-logo-card">
            <Image src="/eu-cofunded-lv.png" width={2048} height={483} alt="Līdzfinansē Eiropas Savienība" className="eu-logo" />
          </div>
          <p className="eu-disclaimer">{DISCLAIMER}</p>
        </section>

        <div className="footer-inner">
          <p><strong>Dadathlon Latvija</strong><br />12. septembris · 10:00–13:00 · Pasta sala, Jelgava</p>
          <p className="footer-note">Jautājumiem par reģistrāciju: <a href="mailto:latvijassportafederacijupadome@gmail.com">latvijassportafederacijupadome@gmail.com</a></p>
        </div>

        <section className="about-project" aria-labelledby="about-project-title">
          <h2 id="about-project-title">Par projektu</h2>
          <p><strong>Dadathlon Latvija</strong> ir daļa no starptautiska Erasmus+ Sport projekta <strong>“Dadathlon sport events – promoting family sports through recreational races for fathers and children”</strong>, kura mērķis ir veicināt ģimeņu fizisko aktivitāti, īpaši iedrošinot tēvus būt aktīviem kopā ar saviem bērniem un ar savu piemēru palīdzēt veidot veselīga un aktīva dzīvesveida paradumus.</p>
          <p>Dadathlon nav tikai skrējiens – tā ir iespēja tēviem un bērniem <strong>kustēties, piedzīvot un pavadīt kvalitatīvu laiku kopā</strong>, stiprinot savstarpējo saikni un radot kopīgas atmiņas.</p>
          <p>Dadathlon Latvija pasākums tiek īstenots, sadarbojoties <strong>Latvijas Sporta federāciju padomei, Jelgavas valstspilsētas pašvaldībai un DaddyHood Europe</strong>.</p>
        </section>
      </div>
    </footer>
  );
}
