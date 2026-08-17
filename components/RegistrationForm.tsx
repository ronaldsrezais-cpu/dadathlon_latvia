"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ADULT_SIZES,
  CHILD_SIZES,
  type ApiResponse,
  type ChildMember,
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
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [code, setCode] = useState(initialCode);
  const [shirtEligible, setShirtEligible] = useState<boolean | null>(mode === "register" ? null : false);
  const [editingReady, setEditingReady] = useState(mode === "register");

  const [teamName, setTeamName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fatherShirtSize, setFatherShirtSize] = useState<RegistrationPayload["fatherShirtSize"]>("");
  const [children, setChildren] = useState<ChildMember[]>([emptyChild()]);
  const [consent, setConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [informationConfirmed, setInformationConfirmed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (!successModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSuccessModalOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [successModalOpen]);

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

  function clearFieldError(fieldId: string) {
    setFieldErrors((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function scrollToField(fieldId: string) {
    window.requestAnimationFrame(() => {
      const element = document.getElementById(fieldId);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => element.focus({ preventScroll: true }), 350);
    });
  }

  function updateChild(id: string, field: keyof ChildMember, value: string) {
    setChildren((current) => current.map((child) => (child.id === id ? { ...child, [field]: value } : child)));
    clearFieldError(field === "age" ? `child-age-${id}` : `child-size-${id}`);
  }

  function addChild() {
    setChildren((current) => [...current, emptyChild()]);
  }

  function removeChild(id: string) {
    setChildren((current) => (current.length === 1 ? current : current.filter((child) => child.id !== id)));
  }

  function resetRegistrationForm() {
    setTeamName("");
    setFatherName("");
    setEmail("");
    setPhone("");
    setFatherShirtSize("");
    setChildren([emptyChild()]);
    setConsent(false);
    setPhotoConsent(false);
    setInformationConfirmed(false);
    setFieldErrors({});
  }

  function closeSuccessModal() {
    setSuccessModalOpen(false);
    if (mode === "register") {
      resetRegistrationForm();
      setResult(null);
      setSubmittedEmail("");
    }
  }

  function validate(): Array<{ fieldId: string; message: string }> {
    const issues: Array<{ fieldId: string; message: string }> = [];

    if (!teamName.trim()) issues.push({ fieldId: "teamName", message: "Norādiet ģimenes vai komandas nosaukumu." });
    if (!fatherName.trim()) issues.push({ fieldId: "fatherName", message: "Norādiet tēva vārdu un uzvārdu." });
    if (!email.trim()) issues.push({ fieldId: "email", message: "Norādiet e-pasta adresi." });
    if (!phone.trim()) issues.push({ fieldId: "phone", message: "Norādiet tālruņa numuru." });

    if (canChooseShirts && !fatherShirtSize) {
      issues.push({ fieldId: "fatherShirtSize", message: "Izvēlieties tēva T-krekla izmēru." });
    }

    children.forEach((child, index) => {
      const ageId = `child-age-${child.id}`;
      const sizeId = `child-size-${child.id}`;
      if (!child.age.trim()) {
        issues.push({ fieldId: ageId, message: `Norādiet bērna Nr. ${index + 1} vecumu.` });
      }
      if (canChooseShirts && !child.shirtSize) {
        issues.push({ fieldId: sizeId, message: `Izvēlieties T-krekla izmēru bērnam Nr. ${index + 1}.` });
      }
    });

    if (!consent) issues.push({ fieldId: "consent", message: "Nepieciešama piekrišana personas datu apstrādei." });
    if (!photoConsent) issues.push({ fieldId: "photoConsent", message: "Apstipriniet informāciju par fotografēšanu un filmēšanu." });
    if (!informationConfirmed) issues.push({ fieldId: "informationConfirmed", message: "Apstipriniet, ka sniegtā informācija ir pareiza." });

    return issues;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setResult(null);

    const validationIssues = validate();
    if (validationIssues.length) {
      setFieldErrors(Object.fromEntries(validationIssues.map((issue) => [issue.fieldId, issue.message])));
      setMessage({ type: "error", text: "Lūdzu, aizpildiet vai pārbaudiet zemāk atzīmētos obligātos laukus." });
      scrollToField(validationIssues[0].fieldId);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const payload: RegistrationPayload = {
        action: mode === "edit" ? "update" : "register",
        code: mode === "edit" ? code : undefined,
        teamName: teamName.trim(),
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
      setSubmittedEmail(email.trim());
      setSuccessModalOpen(true);

      if (mode === "register") {
        const refreshed = await getRegistrationStatus().catch(() => null);
        if (refreshed) setStatus(refreshed);
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Radās kļūda." });
      scrollTop();
    } finally {
      setLoading(false);
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
      setMessage({ type: "success", text: "Pieteikums ir atsaukts. Uz norādīto e-pastu nosūtīts atsaukšanas apstiprinājums." });
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
    <>
      <main className="main-content" id={mode === "register" ? "registracija" : undefined}>
        <div className="shell form-shell">
          <div ref={topRef} tabIndex={-1} />

          {message && (
            <div className={`notice notice--${message.type}`} role="status">
              <strong>{message.type === "success" ? "Gatavs!" : "Lūdzu, pārbaudiet."}</strong>
              <span>{message.text}</span>
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
                <p>Komandā piedalās viens tēvs un viens vai vairāki bērni. Visi komandas dalībnieki 1 km distanci veic kopā.</p>
              </section>

              <section className="form-card">
                <div className="section-heading">
                  <span>1</span>
                  <div><h2>Komandas informācija</h2><p>Norādiet ģimenes / komandas nosaukumu.</p></div>
                </div>

                <div className={`field-group ${fieldErrors.teamName ? "field-group--error" : ""}`}>
                  <label className="field-label" htmlFor="teamName">Ģimenes / komandas nosaukums <em>*</em></label>
                  <input id="teamName" value={teamName} onChange={(e) => { setTeamName(e.target.value); clearFieldError("teamName"); }} placeholder="Piemēram, Ātrie Ozoli" autoComplete="organization" aria-invalid={Boolean(fieldErrors.teamName)} aria-describedby={fieldErrors.teamName ? "teamName-error" : undefined} />
                  {fieldErrors.teamName && <p className="field-error" id="teamName-error">{fieldErrors.teamName}</p>}
                </div>
              </section>

              <section className="form-card">
                <div className="section-heading">
                  <span>2</span>
                  <div><h2>Tēva informācija</h2><p>Uz šo e-pastu nosūtīsim reģistrācijas apstiprinājumu un pieteikuma labošanas kodu.</p></div>
                </div>

                <div className="two-column-grid">
                  <div className={`field-group field-group--wide ${fieldErrors.fatherName ? "field-group--error" : ""}`}>
                    <label className="field-label" htmlFor="fatherName">Vārds, uzvārds <em>*</em></label>
                    <input id="fatherName" value={fatherName} onChange={(e) => { setFatherName(e.target.value); clearFieldError("fatherName"); }} autoComplete="name" aria-invalid={Boolean(fieldErrors.fatherName)} aria-describedby={fieldErrors.fatherName ? "fatherName-error" : undefined} />
                    {fieldErrors.fatherName && <p className="field-error" id="fatherName-error">{fieldErrors.fatherName}</p>}
                  </div>
                  <div className={`field-group ${fieldErrors.email ? "field-group--error" : ""}`}>
                    <label className="field-label" htmlFor="email">E-pasts <em>*</em></label>
                    <input id="email" type="text" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
                    {fieldErrors.email && <p className="field-error" id="email-error">{fieldErrors.email}</p>}
                  </div>
                  <div className={`field-group ${fieldErrors.phone ? "field-group--error" : ""}`}>
                    <label className="field-label" htmlFor="phone">Tālrunis <em>*</em></label>
                    <input id="phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }} autoComplete="tel" placeholder="+371 ..." aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} />
                    {fieldErrors.phone && <p className="field-error" id="phone-error">{fieldErrors.phone}</p>}
                  </div>
                </div>

                {canChooseShirts && (
                  <div className="shirt-selection-layout">
                    <div className={`field-group shirt-field ${fieldErrors.fatherShirtSize ? "field-group--error" : ""}`}>
                      <label className="field-label" htmlFor="fatherShirtSize">Tēva T-krekla izmērs <em>*</em></label>
                      <select id="fatherShirtSize" value={fatherShirtSize} onChange={(e) => { setFatherShirtSize(e.target.value as RegistrationPayload["fatherShirtSize"]); clearFieldError("fatherShirtSize"); }} aria-invalid={Boolean(fieldErrors.fatherShirtSize)} aria-describedby={fieldErrors.fatherShirtSize ? "fatherShirtSize-error" : undefined}>
                        <option value="">Izvēlieties izmēru</option>
                        {ADULT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                      </select>
                      {fieldErrors.fatherShirtSize && <p className="field-error" id="fatherShirtSize-error">{fieldErrors.fatherShirtSize}</p>}
                    </div>
                    <AdultSizeTable />
                  </div>
                )}
              </section>

              <section className="form-card">
                <div className="section-heading">
                  <span>3</span>
                  <div><h2>Bērni</h2></div>
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
                            <div className={`field-group ${fieldErrors[`child-age-${child.id}`] ? "field-group--error" : ""}`}>
                              <label className="field-label" htmlFor={`child-age-${child.id}`}>Bērna vecums <em>*</em></label>
                              <input id={`child-age-${child.id}`} type="number" inputMode="numeric" value={child.age} onChange={(e) => updateChild(child.id, "age", e.target.value)} aria-invalid={Boolean(fieldErrors[`child-age-${child.id}`])} aria-describedby={fieldErrors[`child-age-${child.id}`] ? `child-age-${child.id}-error` : undefined} />
                              {fieldErrors[`child-age-${child.id}`] && <p className="field-error" id={`child-age-${child.id}-error`}>{fieldErrors[`child-age-${child.id}`]}</p>}
                            </div>
                            <div className={`field-group ${fieldErrors[`child-size-${child.id}`] ? "field-group--error" : ""}`}>
                              <label className="field-label" htmlFor={`child-size-${child.id}`}>T-krekla izmērs <em>*</em></label>
                              <select id={`child-size-${child.id}`} value={child.shirtSize} onChange={(e) => updateChild(child.id, "shirtSize", e.target.value)} aria-invalid={Boolean(fieldErrors[`child-size-${child.id}`])} aria-describedby={fieldErrors[`child-size-${child.id}`] ? `child-size-${child.id}-error` : undefined}>
                                <option value="">Izvēlieties izmēru</option>
                                <optgroup label="Bērnu izmēri">
                                  {CHILD_SIZES.map((size) => <option key={`child-${size}`} value={size}>{size}</option>)}
                                </optgroup>
                                <optgroup label="Pieaugušo izmēri">
                                  {ADULT_SIZES.map((size) => <option key={`adult-${size}`} value={size}>{size}</option>)}
                                </optgroup>
                              </select>
                              {fieldErrors[`child-size-${child.id}`] && <p className="field-error" id={`child-size-${child.id}-error`}>{fieldErrors[`child-size-${child.id}`]}</p>}
                              <p className="field-help">Bērnam iespējams izvēlēties arī pieaugušo T-krekla izmēru.</p>
                            </div>
                          </div>
                          <div className="child-size-guides">
                            <ChildSizeTable />
                            <AdultSizeTable />
                          </div>
                        </div>
                      ) : (
                        <div className={`field-group child-age-only ${fieldErrors[`child-age-${child.id}`] ? "field-group--error" : ""}`}>
                          <label className="field-label" htmlFor={`child-age-${child.id}`}>Bērna vecums <em>*</em></label>
                          <input id={`child-age-${child.id}`} type="number" inputMode="numeric" value={child.age} onChange={(e) => updateChild(child.id, "age", e.target.value)} aria-invalid={Boolean(fieldErrors[`child-age-${child.id}`])} aria-describedby={fieldErrors[`child-age-${child.id}`] ? `child-age-${child.id}-error` : undefined} />
                          {fieldErrors[`child-age-${child.id}`] && <p className="field-error" id={`child-age-${child.id}-error`}>{fieldErrors[`child-age-${child.id}`]}</p>}
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

                <label className={`checkbox-row ${fieldErrors.consent ? "checkbox-row--error" : ""}`}>
                  <input id="consent" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); clearFieldError("consent"); }} aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? "consent-error" : undefined} />
                  <span>Piekrītu, ka norādītie personas dati tiek apstrādāti Dadathlon pasākuma organizēšanai un saziņai par dalību. <em>*</em>{fieldErrors.consent && <small className="checkbox-error" id="consent-error">{fieldErrors.consent}</small>}</span>
                </label>

                <label className={`checkbox-row ${fieldErrors.photoConsent ? "checkbox-row--error" : ""}`}>
                  <input id="photoConsent" type="checkbox" checked={photoConsent} onChange={(e) => { setPhotoConsent(e.target.checked); clearFieldError("photoConsent"); }} aria-invalid={Boolean(fieldErrors.photoConsent)} aria-describedby={fieldErrors.photoConsent ? "photoConsent-error" : undefined} />
                  <span>Apstiprinu, ka Dadathlon Latvija ir publisks pasākums, kura laikā iespējama pasākuma dalībnieku fotografēšana un filmēšana, un iegūtie materiāli var tikt publicēti Latvijas Sporta federāciju padomes informatīvajos kanālos, sociālajos tīklos un mājaslapā <a href="https://www.lsfp.lv" target="_blank" rel="noreferrer">www.lsfp.lv</a> sabiedrības informēšanas nolūkos. <em>*</em>{fieldErrors.photoConsent && <small className="checkbox-error" id="photoConsent-error">{fieldErrors.photoConsent}</small>}</span>
                </label>

                <label className={`checkbox-row ${fieldErrors.informationConfirmed ? "checkbox-row--error" : ""}`}>
                  <input id="informationConfirmed" type="checkbox" checked={informationConfirmed} onChange={(e) => { setInformationConfirmed(e.target.checked); clearFieldError("informationConfirmed"); }} aria-invalid={Boolean(fieldErrors.informationConfirmed)} aria-describedby={fieldErrors.informationConfirmed ? "informationConfirmed-error" : undefined} />
                  <span>Apstiprinu, ka sniegtā informācija ir pareiza un bērna dalībai ir likumiskā pārstāvja piekrišana. <em>*</em>{fieldErrors.informationConfirmed && <small className="checkbox-error" id="informationConfirmed-error">{fieldErrors.informationConfirmed}</small>}</span>
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

      {successModalOpen && result?.ok && (
        <div className="success-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeSuccessModal();
        }}>
          <section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
            <button type="button" className="success-modal-close" aria-label="Aizvērt" onClick={closeSuccessModal}>×</button>
            <div className="success-modal-icon" aria-hidden="true">✓</div>
            <p className="success-modal-kicker">{mode === "edit" ? "Pieteikums atjaunots" : "Reģistrācija pabeigta"}</p>
            <h2 id="success-modal-title">{mode === "edit" ? "Izmaiņas veiksmīgi saglabātas!" : "Reģistrācija veiksmīga!"}</h2>
            <p className="success-modal-lead">
              {mode === "edit"
                ? "Jūsu Dadathlon Latvija pieteikuma izmaiņas ir saglabātas."
                : "Paldies! Jūsu ģimene ir reģistrēta Dadathlon Latvija pasākumam."}
            </p>

            <div className={`success-email-status ${result.emailSent ? "success-email-status--sent" : "success-email-status--warning"}`}>
              <span aria-hidden="true">✉️</span>
              <p>
                {result.emailSent
                  ? <>Apstiprinājuma e-pasts ir nosūtīts uz <strong>{submittedEmail}</strong>.</>
                  : <>Pieteikums ir saglabāts, bet apstiprinājuma e-pastu neizdevās nosūtīt. Saglabājiet pieteikuma kodu un, ja nepieciešams, sazinieties ar organizatoriem.</>}
              </p>
            </div>

            {result.code && (
              <div className="success-code-card">
                <span>Pieteikuma kods</span>
                <strong>{result.code}</strong>
                <small>Saglabājiet šo kodu — tas būs nepieciešams, lai labotu vai atsauktu pieteikumu.</small>
              </div>
            )}

            <div className="success-modal-details">
              {result.shirtEligible ? (
                <p><strong>👕 T-krekli rezervēti.</strong>{result.shirtSlot ? ` Jūsu ģimene ir starp pirmajām 150 reģistrētajām ģimenēm (vieta Nr. ${result.shirtSlot}).` : ""}</p>
              ) : (
                <p><strong>Dalība apstiprināta.</strong> 150 ģimeņu T-kreklu limits jau ir sasniegts.</p>
              )}
              <p><strong>🏅 Atgādinājums:</strong> katrs dalībnieks, kas piedalīsies 1 km skrējienā ar šķēršļiem, saņems medaļu.</p>
            </div>

            <div className="success-modal-actions">
              <button type="button" className="primary-button" onClick={closeSuccessModal}>Aizvērt</button>
              {result.editUrl && <a className="secondary-button success-edit-link" href={result.editUrl}>Labot pieteikumu</a>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
