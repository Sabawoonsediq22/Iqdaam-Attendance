import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const navLinks = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Programs", id: "programs" },
    { name: "Gallery", id: "gallery" },
    { name: "Contact", id: "cta" },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 bg-white shadow-l py-2 shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => scrollToSection("home")}
          >
            <Image src="/iqdaam.jpg" alt="Iqdaam Logo" width={42} height={42} />
            <span className={`font-bold text-xl text-slate-800`}>Iqdaam</span>
          </div>

          <div className="hidden md:flex space-x-8">
            {navLinks.map((link: { id: string; name: string }) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`font-medium transition-colors hover:text-blue-600 text-slate-700 cursor-pointer`}
              >
                {link.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollToSection("cta")}
            className="hidden md:block bg-linear-to-r from-blue-600 to-sky-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all cursor-pointer"
          >
            Enroll Now
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-transform duration-150"
          >
            {isOpen ? (
              <X className={`w-6 h-6 text-slate-800`} />
            ) : (
              <Menu className={`w-6 h-6 text-slate-800`} />
            )}
          </motion.button>
        </div>

        <motion.div
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -12 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          {navLinks.map((link) => (
            <motion.button
              whileHover={{ scale: 1.01 }}
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="block w-full text-left text-slate-700 font-medium hover:text-blue-600 transition-colors py-2"
            >
              {link.name}
            </motion.button>
          ))}
          <Button
            onClick={() => scrollToSection("programs")}
            className="w-full bg-linear-to-r from-blue-600 to-sky-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer"
          >
            Enroll Now
          </Button>
        </motion.div>
      </div>
    </nav>
  );
}
