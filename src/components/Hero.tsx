
import React from "react";
import { Button } from "../components/ui/button";
import FadeIn from "./animations/FadeIn";
import { CalendarCheck, BellRing, PhoneCall } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <section className="pt-28 lg:pt-36 pb-20 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8">
            <FadeIn delay={0.1}>
              <span className="bg-health-100 text-health-800 px-3 py-1 text-xs md:text-sm font-medium inline-block rounded-full">
                Revolutionizing Healthcare Scheduling
              </span>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                Intelligent <span className="bg-gradient-to-r from-health-600 to-health-400 bg-clip-text text-transparent">Appointment</span> Automation
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.5}>
              <p className="text-base md:text-lg text-gray-600 max-w-lg">
                Reduce no-shows, optimize staff time, and improve patient experience with our AI-powered scheduling and reminder system.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.7}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-health-600 hover:bg-health-700 text-white rounded-full h-10 md:h-12 px-6 md:px-8 text-sm md:text-base">
                  Start Your Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  className="border-health-200 bg-white text-gray-700 hover:bg-gray-50 rounded-full h-10 md:h-12 px-6 md:px-8 text-sm md:text-base"
                >
                  Book A Demo
                </Button>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.9}>
              <div className="pt-4 md:pt-6">
                <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">Trusted by leading healthcare providers</p>
                <div className="flex flex-wrap gap-4 md:gap-6 items-center">
                  {/* Hospital logos */}
                  <img 
                    src="/lovable-uploads/f31d6c18-387b-4866-96d8-eb8c16bb3959.png" 
                    alt="KATH" 
                    className="h-8 md:h-12 object-contain"
                  />
                  <img 
                    src="/lovable-uploads/de22656c-462c-4b9e-a126-819a8fb8a4a9.png" 
                    alt="KBTH" 
                    className="h-8 md:h-12 object-contain"
                  />
                  <img 
                    src="/lovable-uploads/0ad850dd-d43d-4cef-8432-cceb17af577d.png" 
                    alt="UGMC" 
                    className="h-8 md:h-12 object-contain"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
          
          <FadeIn className="flex justify-center" delay={0.5} direction="left">
            <div className="relative">
              <div className="glass-panel rounded-2xl p-8 max-w-md w-full shadow-xl">
                <div className="absolute -top-3 -right-3 bg-health-600 text-white text-xs px-3 py-1 rounded-full">
                  Live Demo
                </div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-full bg-health-100">
                    <CalendarCheck className="h-6 w-6 text-health-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Upcoming Appointment</h4>
                    <p className="text-sm text-gray-600">Tomorrow, 2:30 PM</p>
                  </div>
                </div>
                
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 rounded-full bg-blue-100">
                      <BellRing className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Appointment Reminder</h5>
                      <p className="text-sm text-gray-600">Korle Bu Teaching Hospital, Diabetes Clinic</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">
                    This is a reminder for your appointment tomorrow at 2:30 PM. Please arrive 15 minutes early.
                  </p>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <PhoneCall className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Voice Call Reminder</h4>
                    <p className="text-sm text-gray-600">Scheduled for today, 5:00 PM</p>
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        Confirm
                      </button>
                      <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -z-10 w-72 h-72 bg-health-200 rounded-full blur-3xl opacity-20 -top-10 -left-10"></div>
              <div className="absolute -z-10 w-60 h-60 bg-blue-300 rounded-full blur-3xl opacity-20 -bottom-10 -right-10"></div>
            </div>
          </FadeIn>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-health-100 rounded-full blur-3xl opacity-60 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: "2s" }}></div>
      </div>
    </section>
  );
};

export default Hero;
