"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { Loader } from "@/components/loader";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen w-dvw"><Loader/></div>;
  }

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
