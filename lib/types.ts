export const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"] as const;
export const CHILD_SIZES = ["2", "4", "6", "8", "10", "12"] as const;

export type AdultSize = (typeof ADULT_SIZES)[number];
export type ChildSize = (typeof CHILD_SIZES)[number];

export type ChildShirtSize = ChildSize | AdultSize;

export type ChildMember = {
  id: string;
  age: string;
  shirtSize: ChildShirtSize | "";
};

export type RegistrationPayload = {
  action: "register" | "update" | "cancel";
  code?: string;
  teamName: string;
  fatherName: string;
  email: string;
  phone: string;
  fatherShirtSize: AdultSize | "";
  children: ChildMember[];
  consent: boolean;
  photoConsent: boolean;
  informationConfirmed: boolean;
};

export type RegistrationStatus = {
  ok: boolean;
  totalRegistrations: number;
  shirtSlotsTaken: number;
  shirtsAvailable: boolean;
  shirtLimit: number;
};

export type ApiResponse = {
  ok: boolean;
  message?: string;
  code?: string;
  editUrl?: string;
  shirtEligible?: boolean;
  shirtSlot?: number | null;
  emailSent?: boolean;
  registration?: RegistrationPayload & {
    shirtEligible: boolean;
    status: string;
  };
};
