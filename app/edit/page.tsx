import { Suspense } from "react";
import EventHeader from "@/components/EventHeader";
import Footer from "@/components/Footer";
import EditClient from "./EditClient";

export default function EditPage() {
  return (
    <>
      <EventHeader compact />
      <Suspense fallback={<main className="main-content"><div className="shell"><section className="form-card">Ielādē…</section></div></main>}>
        <EditClient />
      </Suspense>
      <Footer />
    </>
  );
}
