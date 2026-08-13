export const ADULT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"] as const;
export const CHILD_SIZES = ["6XS", "5XS", "4XS", "3XS", "2XS", "XS"] as const;

export type AdultSize = (typeof ADULT_SIZES)[number];
export type ChildSize = (typeof CHILD_SIZES)[number];

export type ChildMember = {
  id: string;
  age: string;
  shirtSize: ChildSize | "";
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
  registration?: RegistrationPayload & {
    shirtEligible: boolean;
    status: string;
  };
};
