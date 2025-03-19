
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Benefits from "@/components/Benefits";
import CallToAction from "@/components/CallToAction";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Benefits />
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Start Managing Appointments Today</h2>
          <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
            <Button className="bg-health-600 hover:bg-health-700 h-10 md:h-12 text-sm md:text-base px-4 md:px-6" asChild>
              <Link to="/sign-up">Sign Up Now</Link>
            </Button>
            <Button className="bg-health-600 hover:bg-health-700 h-10 md:h-12 text-sm md:text-base px-4 md:px-6" asChild>
              <Link to="/new-appointment">New Appointment</Link>
            </Button>
          </div>
        </div>
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
