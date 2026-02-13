import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const openWhatsApp = () => {
    const phoneNumber = "+93711163551";
    const message =
      "Hello, I would like to inquire about your educational programs.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const quickLinks = [
    { name: "Home", id: "home" },
    { name: "About Us", id: "about" },
    { name: "Programs", id: "programs" },
    { name: "Gallery", id: "gallery" },
  ];

  return (
    <footer id="footer" className="bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div>
                <Image src="/iqdaam.jpg" alt="Iqdaam Logo" width={40} height={40} />
              </div>
              <span className="font-bold text-2xl">Iqdaam</span>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Empowering students through quality education and innovative
              teaching methods since 2014.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={openWhatsApp}
                className="cursor-pointer hover:scale-110 transition-transform"
              >
                <Image src="/whatsapp-logo-4456.svg" alt="WhatsApp" width={32} height={32} />
              </button>
              <a href="https://www.facebook.com/profile.php?id=61554649776632&mibextid=ZbWKwL"
              target="_blank"
                className="hover:scale-110 transition-transform hover:bg-blue-600 rounded w-8 h-8 flex items-center justify-center bg-slate-800"
              >
                <Facebook className="w-8 h-8 p-1 text-white" />
              </a>
              <a href="https://www.instagram.com/abas_danish25?igsh=MWZ0NXNxNTNmZGI4bA=="
              target="_blank"
                className="hover:scale-110 transition-transform hover:bg-blue-600 rounded w-8 h-8 flex items-center justify-center bg-slate-800"
              >
                <Instagram className="w-8 h-8 p-1 text-red-400" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6">Our Programs</h3>
            <ul className="space-y-3 text-slate-400">
              <li>General English</li>
              <li>Grammar Classes</li>
              <li>Speaking Classes</li>
              <li>Computer Programs</li>
              <li>Pashto Dictation</li>
              <li>Professional Development</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <span className="text-slate-400">
                  Near Najaraan Street, Behsood District, Nangarhar Province,
                  Afghanistan
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <span className="text-slate-400">+93 711 163 551</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <span className="text-slate-400">iqdaam.info@gamil.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Iqdaam Educational Center. All
              rights reserved.
            </p>
            <div className="mb-4 md:mb-0">
              <Link
                href="/auth"
                className="text-slate-400 hover:text-white border-slate-700 hover:border-white underline"
              >
                Admin/Teacher Login
              </Link>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-6 pb-4">
        <div className="text-center">
          <p className="text-slate-500 font-medium">
            Developed with ❤️ and lots of coffee☕ by
            <a
              href="https://sabawoonsediqi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors ml-1 underline"
            >
              Eng. Sabawoon Sediqi
            </a>
          </p>
        </div>
      </div>

      <button
        onClick={openWhatsApp}
        className="fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all z-40 cursor-pointer animate-bounce"
        aria-label="Contact us on WhatsApp"
      >
        <Image
          src="/whatsapp-logo-4456.svg"
          alt="WhatsApp"
          width={48}
          height={48}
        />
      </button>
    </footer>
  );
}
