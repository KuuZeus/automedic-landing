
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Menu, X, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isContactPage = location.pathname === "/contact";

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const scrollToSection = (id: string) => {
    if (isContactPage) {
      // If we're on the contact page, navigate to homepage first
      window.location.href = `/#${id}`;
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md py-3 shadow-sm"
          : "bg-transparent py-4 md:py-6"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 text-health-600" strokeWidth={2.5} />
          <span className="text-lg md:text-xl lg:text-2xl font-semibold bg-gradient-to-r from-health-700 to-health-500 bg-clip-text text-transparent">
            SynchoraHealth
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => scrollToSection("features")}
            className="text-sm font-medium text-gray-700 hover:text-health-600 transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("benefits")}
            className="text-sm font-medium text-gray-700 hover:text-health-600 transition-colors"
          >
            Benefits
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-sm font-medium text-gray-700 hover:text-health-600 transition-colors"
          >
            Pricing
          </button>
          <Link to="/contact">
            <Button
              className="bg-health-600 hover:bg-health-700 text-white rounded-full px-6"
            >
              Get Started
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white absolute top-full left-0 right-0 p-4 shadow-md flex flex-col space-y-4 animate-fade-in">
          <button
            onClick={() => scrollToSection("features")}
            className="text-gray-700 hover:text-health-600 transition-colors py-2 px-4"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("benefits")}
            className="text-gray-700 hover:text-health-600 transition-colors py-2 px-4"
          >
            Benefits
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-gray-700 hover:text-health-600 transition-colors py-2 px-4"
          >
            Pricing
          </button>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
            <Button
              className="bg-health-600 hover:bg-health-700 text-white w-full"
            >
              Get Started
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
