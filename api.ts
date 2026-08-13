import type { ApiResponse, RegistrationPayload, RegistrationStatus } from "./types";

const ENDPOINT = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL?.trim() || "";
const DEMO_KEY = "dadathlon-demo-registrations";

function isDemoMode() {
  return !ENDPOINT || ENDPOINT.includes("YOUR_DEPLOYMENT_ID");
}

function readDemoRegistrations(): Array<Record<string, unknown>> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeDemoRegistrations(items: Array<Record<string, unknown>>) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(items));
}

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  if (isDemoMode()) {
    const items = readDemoRegistrations();
    const shirtSlotsTaken = items.filter((item) => item.shirtEligible).length;
    return {
      ok: true,
      totalRegistrations: items.filter((item) => item.status !== "cancelled").length,
      shirtSlotsTaken,
      shirtsAvailable: shirtSlotsTaken < 150,
      shirtLimit: 150,
    };
  }

  const response = await fetch(`${ENDPOINT}?action=status&_=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Neizdevās saņemt reģistrācijas statusu.");
  return response.json();
}

export async function getRegistration(code: string): Promise<ApiResponse> {
  if (isDemoMode()) {
    const item = readDemoRegistrations().find((entry) => entry.code === code);
    return item
      ? { ok: true, registration: item as ApiResponse["registration"] }
      : { ok: false, message: "Pieteikums ar šādu kodu nav atrasts." };
  }

  const response = await fetch(
    `${ENDPOINT}?action=get&code=${encodeURIComponent(code)}&_=${Date.now()}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Neizdevās ielādēt pieteikumu.");
  return response.json();
}

export async function submitRegistration(payload: RegistrationPayload): Promise<ApiResponse> {
  if (isDemoMode()) {
    const registrations = readDemoRegistrations();

    if (payload.action === "register") {
      const shirtSlotsTaken = registrations.filter((item) => item.shirtEligible).length;
      const shirtEligible = shirtSlotsTaken < 150;
      const code = `DAD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const item = {
        ...payload,
        code,
        shirtEligible,
        shirtSlot: shirtEligible ? shirtSlotsTaken + 1 : null,
        status: "active",
      };
      registrations.push(item);
      writeDemoRegistrations(registrations);
      return {
        ok: true,
        code,
        shirtEligible,
        shirtSlot: item.shirtSlot,
        editUrl: `${window.location.origin}/edit?code=${encodeURIComponent(code)}`,
      };
    }

    const index = registrations.findIndex((entry) => entry.code === payload.code);
    if (index < 0) return { ok: false, message: "Pieteikums nav atrasts." };

    if (payload.action === "cancel") {
      registrations[index] = { ...registrations[index], status: "cancelled" };
      writeDemoRegistrations(registrations);
      return { ok: true, message: "Pieteikums ir atsaukts." };
    }

    registrations[index] = {
      ...registrations[index],
      ...payload,
      status: "active",
    };
    writeDemoRegistrations(registrations);
    return {
      ok: true,
      code: String(payload.code),
      shirtEligible: Boolean(registrations[index].shirtEligible),
    };
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Neizdevās saglabāt pieteikumu.");
  return response.json();
}

export function demoModeEnabled() {
  return isDemoMode();
}
