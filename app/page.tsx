import EventHeader from "@/components/EventHeader";
import Footer from "@/components/Footer";
import Programme from "@/components/Programme";
import RegistrationForm from "@/components/RegistrationForm";

export default function HomePage() {
  return (
    <>
      <EventHeader />
      <Programme />
      <RegistrationForm />
      <Footer />
    </>
  );
}
