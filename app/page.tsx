"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowRight, CheckCircle, Star, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 text-gray-800">
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="StudentTracker"
                width={40}
                height={40}
              />
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
                StudentTracker
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("home")}
                className="hover:text-indigo-600"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="hover:text-indigo-600"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="hover:text-indigo-600"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="hover:text-indigo-600"
              >
                How it works
              </button>
              <Button
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-4">
              <div className="flex flex-col px-4 space-y-3">
                <button
                  onClick={() => scrollToSection("home")}
                  className="text-left"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-left"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-left"
                >
                  How it works
                </button>
                <Button asChild className="w-full bg-indigo-600 text-white">
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <header id="home" className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Smart attendance
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-blue-500">
                  for educators and institutions
                </span>
              </h1>

              <p className="text-lg text-gray-600 max-w-2xl">
                StudentTracker helps schools and colleges automate attendance,
                get actionable insights, and keep student data secure — all in a
                fast, mobile-friendly interface.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                >
                  <Link href="/auth" aria-label="Get started">
                    <span className="inline-flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Get started
                      <ArrowRight className="ml-3 h-4 w-4" />
                    </span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-indigo-600 text-indigo-600"
                >
                  Watch demo
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time attendance
                </span>
                <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Smart reports
                </span>
                <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Secure & private
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end relative">
              <div className="w-full max-w-xl">
                <Image
                  src="/hero-illustration.svg"
                  alt="Dashboard"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                <div className="absolute -top-4 -right-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Live data
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* About */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/about-illustration.svg"
                alt="About"
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Revolutionizing education management
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Built for schools and colleges that need reliable attendance
                tracking and clear insights. Save time, reduce errors, and
                support student success with reports that matter.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <div className="font-medium">Real-time tracking</div>
                    <div className="text-sm text-gray-500">
                      Instant visibility into attendance
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <div className="font-medium">Automated reports</div>
                    <div className="text-sm text-gray-500">
                      Exportable and customizable
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <div className="font-medium">Mobile ready</div>
                    <div className="text-sm text-gray-500">
                      Works on all devices
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <div className="font-medium">Secure</div>
                    <div className="text-sm text-gray-500">
                      Encrypted & role-based access
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-20 bg-linear-to-br from-blue-50 to-indigo-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              Powerful features for modern education
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to manage student attendance efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="transform hover:scale-105 transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Image
                  src="/feature-1.svg"
                  alt="Analytics"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-600 text-sm">
                  Real-time metrics and trends to support decisions
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Image
                  src="/feature-2.svg"
                  alt="Mobile"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Mobile Access</h3>
                <p className="text-gray-600 text-sm">
                  Take attendance from any device
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Image
                  src="/feature-3.svg"
                  alt="Reports"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Smart Reports</h3>
                <p className="text-gray-600 text-sm">
                  Advanced filters and export options
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Image
                  src="/feature-4.svg"
                  alt="Security"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">
                  Enterprise Security
                </h3>
                <p className="text-gray-600 text-sm">
                  Encrypted data and role-based access
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="text-lg text-gray-600">
              Get set up in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Image
                src="/step-1.svg"
                alt="Sign up"
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto mx-auto mb-4"
              />
              <p className="text-gray-600">
                Create your account and set up your institution
              </p>
            </div>

            <div className="text-center">
              <Image
                src="/step-2.svg"
                alt="Add students"
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto mx-auto mb-4"
              />
              <p className="text-gray-600">
                Import student lists and organize classes
              </p>
            </div>

            <div className="text-center">
              <Image
                src="/step-3.svg"
                alt="Track"
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Track & report</h3>
              <p className="text-gray-600">
                Take attendance and generate reports instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-linear-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">
              What educators say
            </h2>
            <p className="text-lg text-gray-600">
              Trusted by schools and institutions worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Hamid Dawran",
                title: "Principal, Wahdat High School",
                avatar: "/testimonial-1.svg",
                quote:
                  "StudentTracker has revolutionized how we manage attendance. The insights we get are invaluable.",
              },
              {
                name: "Mohammad Amin",
                title: "English Instructor, Kabul Academy",
                avatar: "/testimonial-2.svg",
                quote:
                  "The mobile app makes taking attendance during class so much easier. No more paperwork!",
              },
              {
                name: "Abobaker Sediq Azizi",
                title: "Senior Instructor, Iqdaam Educational Center",
                avatar: "/testimonial-3.svg",
                quote:
                  "Outstanding security features and reliable performance.",
              },
            ].map((t, idx) => (
              <Card key={idx} className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">“{t.quote}”</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-linear-to-r from-indigo-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Ready to transform attendance?
          </h2>
          <p className="text-lg text-indigo-100 mb-8">
            Start a free trial or schedule a demo with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 shadow-lg"
            >
              <Link href="/auth">Get started</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-indigo-600"
            >
              Schedule demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.svg"
                  alt="StudentTracker"
                  width={40}
                  height={40}
                />
                <span className="text-xl font-bold">StudentTracker</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Smart, secure attendance management for modern institutions.
              </p>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  f
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  t
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  i
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#">Features</a>
                </li>
                <li>
                  <a href="#">Pricing</a>
                </li>
                <li>
                  <a href="#">Security</a>
                </li>
                <li>
                  <a href="#">Integrations</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#">Help Center</a>
                </li>
                <li>
                  <a href="#">Contact Us</a>
                </li>
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Terms</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 StudentTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
