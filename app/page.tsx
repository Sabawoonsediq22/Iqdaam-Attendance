"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import VisionMission from "@/components/VisionMission";
import CEOMessage from "@/components/CEOMessage";
import Programs from "@/components/Programs";
import Gallery from "@/components/Gallery";
import WhyChoose from "@/components/WhyChoose";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
      <div className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <VisionMission />
      <CEOMessage />
      <Programs />
      <Gallery />
      <WhyChoose />
      <CTA />
      <Footer />
    </div>
  );
}
