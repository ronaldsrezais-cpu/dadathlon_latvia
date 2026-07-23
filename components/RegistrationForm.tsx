"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ADULT_SIZES,
  CHILD_SIZES,
  DISTANCES,
  type ApiResponse,
  type ChildMember,
  type Distance,
  type RegistrationPayload,
  type RegistrationStatus,
} from "@/lib/types";
import {
  getRegistration,
  getRegistrationStatus,
  submitRegistration,
} from "@/lib/api";
import { AdultSizeTable, ChildSizeTable } from "./SizeGuide";

const emptyChild = (): ChildMember => ({
  id: crypto.randomUUID(),
  age: "",
  shirtSize: "",
});

const emptyStatus: RegistrationStatus = {
  ok: true,
  totalRegistrations: 0,
  shirtSlotsTaken: 0,
  shirtsAvailable: true,
  shirtLimit: 150,
};

type Props = {
  mode?: "register" | "edit";
  initialCode?: string;
};

export default function RegistrationForm({ mode = "register", initialCode = "" }: Props) {
  const topRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRegistration, setLoadingRegistration] = useState(mode === "edit" && Boolean(initialCode));
  const [status, setStatus] = useState<RegistrationStatus>(emptyStatus);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [code, setCode] = useState(initialCode);
  const [shirtEligible, setShirtEligible] = useState<boolean | null>(mode === "register" ? null : false);
  const [editingReady, setEditingReady] = useState(mode === "register");

  const [teamName, setTeamName] = useState("");
  const [distance, setDistance] = useState<Distance | "">("");
  const [fatherName, setFatherName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fatherShirtSize, setFatherShirtSize] = useState<RegistrationPayload["fatherShirtSize"]>("");
  const [children, setChildren] = useState<ChildMember[]>([emptyChild()]);
  const [consent, setConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [informationConfirmed, setInformationConfirmed] = useState(false);

  const canChooseShirts = mode === "edit" ? Boolean(shirtEligible) : status.shirtsAvailable;

  useEffect(() => {
    getRegistrationStatus()
      .then((data) => setStatus(data))
      .catch(() => setStatus(emptyStatus))
      .finally(() => setStatusLoaded(true));
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !initialCode) return;
    loadRegistration(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialCode]);

  async function loadRegistration(registrationCode: string) {
    setLoadingRegistration(true);
    setMessage(null);
    try {
      const response = await getRegistration(registrationCode.trim());
      if (!response.ok || !response.registration) {
        setEditingReady(false);
        setMessage({ type: "error", text: response.message || "Pieteikums nav atrasts." });
        return;
      }
      const registration = response.registration;
      setCode(registrationCode.trim());
      setEditingReady(true);
      setTeamName(registration.teamName || "");
      setDistance(registration.distance || "");
      setFatherName(registration.fatherName || "");
      setEmail(registration.email || "");
      setPhone(registration.phone || "");
      setFatherShirtSize(registration.fatherShirtSize || "");
      setChildren(registration.children?.length ? registration.children : [emptyChild()]);
      setConsent(Boolean(registration.consent));
      setPhotoConsent(Boolean(registration.photoConsent));
      setInformationConfirmed(Boolean(registration.informationConfirmed));
      setShirtEligible(Boolean(registration.shirtEligible));
      if (registration.status === "cancelled") {
        setMessage({ type: "error", text: "Šis pieteikums ir atsaukts." });
      }
    } catch (error) {
      setEditingReady(false);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Radās kļūda." });
    } finally {
      setLoadingRegistration(false);
      scrollTop();
    }
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    topRef.current?.focus({ preventScroll: true });
  }

  function updateChild(id: string, field: keyof ChildMember, value: string) {
    setChildren((current) => current.map((child) => (child.id === id ? { ...child, [field]: value } : child)));
  }

  function addChild() {
    setChildren((current) => [...current, emptyChild()]);
  }

  function removeChild(id: string) {
    setChildren((current) => (current.length === 1 ? current : current.filter((child) => child.id !== id)));
  }

  function validate(): string | null {
    if (!teamName.trim()) return "Norādiet ģimenes vai komandas nosaukumu.";
    if (!distance) return "Izvēlieties distanci.";
    if (!fatherName.trim()) return "Norādiet tēva vārdu un uzvārdu.";
    if (!email.trim()) return "Norādiet e-pasta adresi.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Pārbaudiet e-pasta adresi.";
    if (!phone.trim()) return "Norādiet tālruņa numuru.";
    if (children.some((child) => !child.age.trim())) return "Norādiet katra bērna vecumu.";
    if (canChooseShirts && !fatherShirtSize) return "Izvēlieties tēva T-krekla izmēru.";
    if (canChooseShirts && children.some((child) => !child.shirtSize)) return "Izvēlieties T-krekla izmēru katram bērnam.";
    if (!consent) return "Lai iesniegtu pieteikumu, nepieciešama piekrišana personas datu apstrādei.";
    if (!photoConsent) return "Apstipriniet, ka esat informēts par fotografēšanu un filmēšanu pasākuma laikā.";
    if (!informationConfirmed) return "Apstipriniet, ka norādītā informācija ir pareiza.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setResult(null);

    const validationError = validate();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      scrollTop();
      return;
    }

    setLoading(true);
    try {
      const payload: RegistrationPayload = {
        action: mode === "edit" ? "update" : "register",
        code: mode === "edit" ? code : undefined,
        teamName: teamName.trim(),
        distance,
        fatherName: fatherName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        fatherShirtSize: canChooseShirts ? fatherShirtSize : "",
        children: children.map((child) => ({
          id: child.id,
          age: child.age.trim(),
          shirtSize: canChooseShirts ? child.shirtSize : "",
        })),
        consent,
        photoConsent,
        informationConfirmed,
      };

      const response = await submitRegistration(payload);
      if (!response.ok) throw new Error(response.message || "Pieteikumu neizdevās saglabāt.");

      setResult(response);
      setMessage({
        type: "success",
        text:
          mode === "edit"
            ? "Izmaiņas ir saglabātas. Atjaunots apstiprinājums nosūtīts uz norādīto e-pastu."
            : "Paldies! Jūsu ģimene ir reģistrēta pasākumam Dadathlon Latvija.",
      });

      if (mode === "register") {
        const refreshed = await getRegistrationStatus().catch(() => null);
        if (refreshed) setStatus(refreshed);
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Radās kļūda." });
    } finally {
      setLoading(false);
      scrollTop();
    }
  }

  async function cancelRegistration() {
    if (!code || !window.confirm("Vai tiešām vēlaties atsaukt dalību?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await submitRegistration({
        action: "cancel",
        code,
        teamName,
        distance,
        fatherName,
        email,
        phone,
        fatherShirtSize,
        children,
        consent,
        photoConsent,
        informationConfirmed,
      });
      if (!response.ok) throw new Error(response.message || "Pieteikumu neizdevās atsaukt.");
      setMessage({ type: "success", text: "Pieteikums ir atsaukts." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Radās kļūda." });
    } finally {
      setLoading(false);
      scrollTop();
    }
  }

  if (mode === "edit" && !editingReady) {
    return (
      <main className="main-content">
        <div className="shell narrow-shell">
          <section className="form-card lookup-card">
            <h2>Atrodiet savu pieteikumu</h2>
            <p>Ievadiet unikālo kodu, kas nosūtīts reģistrācijas apstiprinājuma e-pastā.</p>
            <label className="field-label" htmlFor="lookup-code">Pieteikuma kods</label>
            <div className="lookup-row">
              <input id="lookup-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DAD-XXXXXX" />
              <button type="button" className="primary-button" disabled={!code.trim() || loadingRegistration} onClick={() => loadRegistration(code)}>
                {loadingRegistration ? "Meklē…" : "Atvērt pieteikumu"}
              </button>
            </div>
            {message && <div className={`notice notice--${message.type}`}>{message.text}</div>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="shell form-shell">
        <div ref={topRef} tabIndex={-1} />

        {message && (
          <div className={`notice notice--${message.type}`} role="status">
            <strong>{message.type === "success" ? "Gatavs!" : "Lūdzu, pārbaudiet."}</strong>
            <span>{message.text}</span>
            {result?.code && (
              <div className="result-details">
                <p>Jūsu pieteikuma kods: <strong>{result.code}</strong></p>
                {result.shirtEligible ? (
                  <p>Jūsu ģimenei ir rezervēti T-krekli{result.shirtSlot ? ` (reģistrācijas vieta Nr. ${result.shirtSlot})` : ""}.</p>
                ) : (
                  <p>150 ģimeņu T-kreklu limits jau ir sasniegts, taču dalība pasākumā ir apstiprināta.</p>
                )}
                {result.editUrl && <a className="inline-link" href={result.editUrl}>Labot vai atsaukt pieteikumu</a>}
              </div>
            )}
          </div>
        )}

        {loadingRegistration ? (
          <section className="form-card"><p>Ielādē pieteikumu…</p></section>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <section className={`shirt-status ${statusLoaded && !status.shirtsAvailable ? "shirt-status--closed" : ""}`}>
                <div>
                  <span className="shirt-icon">👕</span>
                  <div>
                    <strong>{statusLoaded && !status.shirtsAvailable ? "T-kreklu vietas ir aizpildītas" : "Lieliska iespēja agrajiem putniem!"}</strong>
                    <p>
                      {!statusLoaded
                        ? "Pārbauda T-kreklu pieejamību…"
                        : status.shirtsAvailable
                          ? "Pirmajām 150 ģimenēm, kas reģistrēsies, tiks nodrošināti pasākuma T-krekli visiem pieteiktajiem komandas dalībniekiem."
                          : "Reģistrācija turpinās, bet T-kreklu izmēri vairs nav jānorāda."}
                    </p>
                  </div>
                </div>
                <span className="status-count">{Math.min(status.shirtSlotsTaken, 150)} / 150</span>
              </section>
            )}

            <section className="form-card intro-card">
              <p className="section-kicker">Reģistrācija</p>
              <h2>{mode === "edit" ? "Labojiet ģimenes pieteikumu" : "Piesakiet savu ģimeni"}</h2>
              <p>Komandā piedalās viens tēvs un viens vai vairāki bērni. Visi komandas dalībnieki veic vienu izvēlēto distanci kopā.</p>
            </section>

            <section className="form-card">
              <div className="section-heading">
                <span>1</span>
                <div><h2>Komandas informācija</h2><p>Izvēlieties komandas nosaukumu un distanci.</p></div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="teamName">Ģimenes / komandas nosaukums <em>*</em></label>
                <input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Piemēram, Ātrie Ozoli" autoComplete="organization" />
              </div>

              <fieldset className="field-group">
                <legend className="field-label">Izvēlētā distance <em>*</em></legend>
                <div className="distance-grid">
                  {DISTANCES.map((option, index) => (
                    <label key={option} className={`distance-card ${distance === option ? "distance-card--selected" : ""}`}>
                      <input type="radio" name="distance" value={option} checked={distance === option} onChange={() => setDistance(option)} />
                      <span className="distance-icon">{index === 0 ? "👟" : index === 1 ? "🏃" : "🏁"}</span>
                      <strong>{option}</strong>
                      <small>{index === 0 ? "īsākā distance" : index === 1 ? "vidējā distance" : "garākā distance"}</small>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section className="form-card">
              <div className="section-heading">
                <span>2</span>
                <div><h2>Tēva informācija</h2><p>Uz šo e-pastu nosūtīsim apstiprinājumu un pieteikuma labošanas kodu.</p></div>
              </div>

              <div className="two-column-grid">
                <div className="field-group field-group--wide">
                  <label className="field-label" htmlFor="fatherName">Vārds, uzvārds <em>*</em></label>
                  <input id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} autoComplete="name" />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="email">E-pasts <em>*</em></label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="phone">Tālrunis <em>*</em></label>
                  <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+371 ..." />
                </div>
              </div>

              {canChooseShirts && (
                <div className="shirt-selection-layout">
                  <div className="field-group shirt-field">
                    <label className="field-label" htmlFor="fatherShirtSize">Tēva T-krekla izmērs <em>*</em></label>
                    <select id="fatherShirtSize" value={fatherShirtSize} onChange={(e) => setFatherShirtSize(e.target.value as RegistrationPayload["fatherShirtSize"])}>
                      <option value="">Izvēlieties izmēru</option>
                      {ADULT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </div>
                  <AdultSizeTable />
                </div>
              )}
            </section>

            <section className="form-card">
              <div className="section-heading">
                <span>3</span>
                <div><h2>Bērni</h2><p>Norādiet katra bērna vecumu un, ja pieejams, T-krekla izmēru.</p></div>
              </div>

              <div className="children-list">
                {children.map((child, index) => (
                  <article className="child-card" key={child.id}>
                    <div className="child-card-header">
                      <h3>Bērns Nr. {index + 1}</h3>
                      {children.length > 1 && <button type="button" className="remove-button" onClick={() => removeChild(child.id)}>Noņemt</button>}
                    </div>
                    {canChooseShirts ? (
                      <div className="child-size-layout">
                        <div className="child-size-fields">
                          <div className="field-group">
                            <label className="field-label" htmlFor={`child-age-${child.id}`}>Bērna vecums <em>*</em></label>
                            <input id={`child-age-${child.id}`} type="number" min="1" max="17" inputMode="numeric" value={child.age} onChange={(e) => updateChild(child.id, "age", e.target.value)} />
                          </div>
                          <div className="field-group">
                            <label className="field-label" htmlFor={`child-size-${child.id}`}>T-krekla izmērs <em>*</em></label>
                            <select id={`child-size-${child.id}`} value={child.shirtSize} onChange={(e) => updateChild(child.id, "shirtSize", e.target.value)}>
                              <option value="">Izvēlieties izmēru</option>
                              {CHILD_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                          </div>
                        </div>
                        <ChildSizeTable />
                      </div>
                    ) : (
                      <div className="field-group child-age-only">
                        <label className="field-label" htmlFor={`child-age-${child.id}`}>Bērna vecums <em>*</em></label>
                        <input id={`child-age-${child.id}`} type="number" min="1" max="17" inputMode="numeric" value={child.age} onChange={(e) => updateChild(child.id, "age", e.target.value)} />
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <button type="button" className="secondary-button add-child-button" onClick={addChild}>+ Pievienot vēl vienu bērnu</button>
            </section>

            <section className="form-card">
              <div className="section-heading">
                <span>4</span>
                <div><h2>Apstiprinājums</h2><p>Pārbaudiet informāciju pirms pieteikuma iesniegšanas.</p></div>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>Piekrītu, ka norādītie personas dati tiek apstrādāti Dadathlon pasākuma organizēšanai un saziņai par dalību. <em>*</em></span>
              </label>

              <label className="checkbox-row">
                <input type="checkbox" checked={photoConsent} onChange={(e) => setPhotoConsent(e.target.checked)} />
                <span>Apstiprinu, ka Dadathlon Latvija ir publisks pasākums, kura laikā iespējama pasākuma dalībnieku fotografēšana un filmēšana, un iegūtie materiāli var tikt publicēti Latvijas Sporta federāciju padomes informatīvajos kanālos, sociālajos tīklos un mājaslapā <a href="https://www.lsfp.lv" target="_blank" rel="noreferrer">www.lsfp.lv</a> sabiedrības informēšanas nolūkos. <em>*</em></span>
              </label>

              <label className="checkbox-row">
                <input type="checkbox" checked={informationConfirmed} onChange={(e) => setInformationConfirmed(e.target.checked)} />
                <span>Apstiprinu, ka sniegtā informācija ir pareiza un bērna dalībai ir likumiskā pārstāvja piekrišana. <em>*</em></span>
              </label>

              <p className="required-note"><em>*</em> Obligāti aizpildāms lauks.</p>

              <div className="submit-row">
                <button type="submit" className="primary-button primary-button--large" disabled={loading}>
                  {loading ? "Saglabā…" : mode === "edit" ? "Saglabāt izmaiņas" : "Apstiprināt dalību"}
                </button>
                {mode === "edit" && (
                  <button type="button" className="danger-button" disabled={loading} onClick={cancelRegistration}>Atsaukt dalību</button>
                )}
              </div>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
