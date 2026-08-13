const activities = [
  { name: "Vieglatlētika", icon: "🏃" },
  { name: "Tēvu un dēlu laivu izbrauciens", icon: "🚣" },
  { name: "Basketbola metieni", icon: "🏀" },
  { name: "Hokejs", icon: "🏒" },
  { name: "Spēka stacija", icon: "💪" },
  { name: "Orientēšanās", icon: "🧭" },
  { name: "Futbols", icon: "⚽" },
  { name: "Volejbols", icon: "🏐" },
  { name: "Sporta tūrisms", icon: "🥾" },
  { name: "Taekvondo", icon: "🥋" },
  { name: "Nūjošana", icon: "🚶" },
  { name: "Ķer un servē", icon: "🎾" },
  { name: "Zumba", icon: "💃" },
  { name: "Petanka", icon: "🎯" },
  { name: "Šķēršļu josla", icon: "🚧" },
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
            <p className="programme-invitation">
              Gatavojoties skrējienam, aktivitāšu stacijas varēs izmēģināt ikviens – <strong>mammas</strong>, tēvi, bērni un vecvecāki. Nāciet kopā, izkustieties, izmēģiniet ko jaunu un izbaudiet aktīvu laiku visai ģimenei!
            </p>
            <div className="activity-grid">
              {activities.map((activity) => (
                <div className="activity-item" key={activity.name}>
                  <span className="activity-icon" aria-hidden="true">{activity.icon}</span>
                  <p>{activity.name}</p>
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
                <strong>Skrējiens ar šķēršļiem · 1 km</strong>
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
