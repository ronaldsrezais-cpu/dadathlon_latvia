const activities = [
  "Vieglatlētika",
  "Tēvu un dēlu laivu izbrauciens",
  "Basketbola metieni",
  "Hokejs",
  "Spēka stacija",
  "Orientēšanās",
  "Futbols",
  "Volejbols",
  "Sporta tūrisms",
  "Taekvondo",
  "Nūjošana",
  "Ķer un servē",
  "Zumba",
  "Petanka",
  "Šķēršļu josla",
];

export default function Programme() {
  return (
    <section className="programme-section" aria-labelledby="programme-title">
      <div className="shell form-shell">
        <div className="programme-card">
          <div className="programme-heading">
            <p className="section-kicker">Pasākuma programma</p>
            <h2 id="programme-title">Dadathlon Latvija programma</h2>
          </div>

          <div className="programme-block">
            <div className="programme-time">
              <strong>10:00–13:00</strong>
              <span>Sporta/aktivitāšu stacijas</span>
            </div>
            <div className="activity-grid">
              {activities.map((activity) => (
                <div className="activity-item" key={activity}>
                  <span aria-hidden="true">•</span>
                  <p>{activity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="programme-schedule">
            <div className="schedule-item">
              <div className="schedule-time">11:45</div>
              <div>
                <strong>Iesildīšanās skrējienam</strong>
              </div>
            </div>
            <div className="schedule-item schedule-item--highlight">
              <div className="schedule-time">12:00</div>
              <div>
                <strong>Skrējiens ar šķēršļiem</strong>
              </div>
            </div>
          </div>

          <div className="medal-note">
            <span className="medal-note-icon" aria-hidden="true">🏅</span>
            <p><strong>Katrs dalībnieks, kas piedalīsies skrējienā, saņems medaļu.</strong></p>
          </div>
        </div>
      </div>
    </section>
  );
}
