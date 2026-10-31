import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
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
      className={`fixed w-full z-50 transition-all duration-300 bg-background shadow-md py-2`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => scrollToSection("home")}
          >
            <Image src="/iqdaam.jpg" alt="Iqdaam Logo" width={42} height={42} />
            <span className={`font-bold text-xl text-foreground`}>Iqdaam</span>
          </div>

          <div className="hidden md:flex space-x-8">
            {navLinks.map((link: { id: string; name: string }) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`font-medium transition-colors hover:text-primary text-foreground cursor-pointer`}
              >
                {link.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollToSection("cta")}
            className={cn(
              buttonVariants({ variant: "default" }),
              "hidden md:block px-6 font-medium hover:scale-105 transition-all"
            )}
          >
            Enroll Now
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-transform duration-150"
          >
            {isOpen ? (
              <X className={`w-6 h-6 text-foreground`} />
            ) : (
              <Menu className={`w-6 h-6 text-foreground`} />
            )}
          </motion.button>
        </div>

        <motion.div
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -12 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`md:hidden bg-background rounded-xl shadow-md p-6 space-y-4 ${isOpen ? 'block' : 'hidden'}`}
        >
          {navLinks.map((link) => (
            <motion.button
              whileHover={{ scale: 1.01 }}
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="block w-full text-left text-foreground font-medium hover:text-primary transition-colors py-2"
            >
              {link.name}
            </motion.button>
          ))}
          <Button
            onClick={() => scrollToSection("programs")}
            className="w-full px-6 py-3 font-medium"
          >
            Enroll Now
          </Button>
        </motion.div>
      </div>
    </nav>
  );
}
