import type { ApiResponse, RegistrationPayload, RegistrationStatus } from "./types";

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwkXt6N5L1tXgkRgc_JBdna4yDw8v9zxrrfogfKDLUIggEQTqdy8JigMcvxYB8NW4PN/exec";

const ENDPOINT = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL?.trim() || DEFAULT_APPS_SCRIPT_URL;
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
    const activeItems = items.filter((item) => item.status !== "cancelled");
    const shirtSlotsTaken = activeItems.filter((item) => item.shirtEligible).length;
    return {
      ok: true,
      totalRegistrations: activeItems.length,
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
      const activeShirtRegistrations = registrations.filter(
        (item) => item.status !== "cancelled" && item.shirtEligible,
      );
      const shirtEligible = activeShirtRegistrations.length < 150;
      const usedSlots = new Set(
        activeShirtRegistrations
          .map((item) => Number(item.shirtSlot) || 0)
          .filter((slot) => slot >= 1 && slot <= 150),
      );
      let nextShirtSlot: number | null = null;
      if (shirtEligible) {
        for (let slot = 1; slot <= 150; slot += 1) {
          if (!usedSlots.has(slot)) {
            nextShirtSlot = slot;
            break;
          }
        }
      }
      const code = `DAD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const item = {
        ...payload,
        code,
        shirtEligible,
        shirtSlot: shirtEligible ? nextShirtSlot : null,
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
        emailSent: false,
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
      shirtSlot: Number(registrations[index].shirtSlot) || null,
      editUrl: `${window.location.origin}/edit?code=${encodeURIComponent(String(payload.code))}`,
      emailSent: false,
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
