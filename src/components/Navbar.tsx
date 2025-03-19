
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md py-4 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/df9b6056-a446-4110-afd9-43380f806621.png" 
            alt="SynchoraHealth Logo" 
            className="h-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-sm font-medium text-gray-700 hover:text-health-600 transition-colors"
          >
            Features
          </a>
          <a
            href="#benefits"
            className="text-sm font-medium text-gray-700 hover:text-health-600 transition-colors"
          >
            Benefits
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-gray-700 hover:text-health-600 transition-colors"
          >
            Pricing
          </a>
          <Link to="/platform">
            <Button
              className="bg-health-600 hover:bg-health-700 text-white rounded-full px-6"
            >
              Platform
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
          <a
            href="#features"
            className="text-gray-700 hover:text-health-600 transition-colors py-2 px-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#benefits"
            className="text-gray-700 hover:text-health-600 transition-colors py-2 px-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            Benefits
          </a>
          <a
            href="#pricing"
            className="text-gray-700 hover:text-health-600 transition-colors py-2 px-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </a>
          <Link to="/platform" onClick={() => setMobileMenuOpen(false)}>
            <Button
              className="bg-health-600 hover:bg-health-700 text-white w-full"
            >
              Platform
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
