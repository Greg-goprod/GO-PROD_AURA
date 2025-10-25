import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import Why from "../../components/landing/Why";
import Modules from "../../components/landing/Modules";
import Personas from "../../components/landing/Personas";
import Dashboard from "../../components/landing/Dashboard";
import Security from "../../components/landing/Security";
import Pricing from "../../components/landing/Pricing";
import Testimonials from "../../components/landing/Testimonials";
import Tech from "../../components/landing/Tech";
import FinalCta from "../../components/landing/FinalCta";
import Footer from "../../components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-white">
      <Navbar />
      <Hero />
      <Why />
      <Modules />
      <Personas />
      <Dashboard />
      <Security />
      <Pricing />
      <Testimonials />
      <Tech />
      <FinalCta />
      <Footer />
    </main>
  );
}

