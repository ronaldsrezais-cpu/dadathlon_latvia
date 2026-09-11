"use client";

import { useEffect, useState } from "react";
import { getRegistrationStatus } from "@/lib/api";

export default function RegistrationClosed() {
  const [totalRegistrations, setTotalRegistrations] = useState<number | null>(null);

  useEffect(() => {
    getRegistrationStatus()
      .then((status) => setTotalRegistrations(status.totalRegistrations))
      .catch(() => setTotalRegistrations(null));
  }, []);

  return (
    <main className="main-content" id="registracija">
      <div className="shell form-shell">
        {totalRegistrations !== null && (
          <section className="registration-total-status" aria-label="Reģistrēto komandu skaits">
            <span className="registration-total-status__icon" aria-hidden="true">👨‍👧‍👦</span>
            <div>
              <span>Reģistrētās komandas</span>
              <strong>{totalRegistrations}</strong>
            </div>
          </section>
        )}

        <section className="form-card registration-closed-card">
          <div className="registration-closed-card__icon" aria-hidden="true">✓</div>
          <p className="section-kicker">Reģistrācija</p>
          <h2>Tiešsaistes reģistrācija ir noslēgusies</h2>

          <p className="registration-closed-card__lead">
            Nepaspēji pieteikties? <strong>Gaidīsim Tevi un Tavu ģimeni pasākumā!</strong>
          </p>

          <p>
            Reģistrēties un pieteikt komandu būs iespējams arī{" "}
            <strong>uz vietas pasākuma reģistrācijas teltī</strong>.
          </p>

          <p className="registration-closed-card__meeting">
            <strong>Tiekamies 12. septembrī Pasta salā, Jelgavā!</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
