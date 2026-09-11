import EventHeader from "@/components/EventHeader";
import Footer from "@/components/Footer";
import Programme from "@/components/Programme";
import RegistrationClosed from "@/components/RegistrationClosed";

export default function HomePage() {
  return (
    <>
      <EventHeader />
      <Programme />
      <RegistrationClosed />
      <Footer />
    </>
  );
}
