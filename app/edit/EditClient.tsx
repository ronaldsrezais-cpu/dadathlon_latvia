"use client";

import { useSearchParams } from "next/navigation";
import RegistrationForm from "@/components/RegistrationForm";

export default function EditClient() {
  const params = useSearchParams();
  const code = params.get("code") || "";
  return <RegistrationForm mode="edit" initialCode={code} />;
}
