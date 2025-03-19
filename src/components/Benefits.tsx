
import React from "react";
import FadeIn from "./animations/FadeIn";
import { Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Benefits: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <section id="benefits" className="py-16 md:py-20 bg-white">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <FadeIn>
              <div className="relative">
                <div className="glass-panel rounded-2xl p-4 md:p-6 lg:p-8">
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-4 md:gap-5 p-3 md:p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-green-100 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-lg md:text-xl font-bold flex items-center justify-center">87%</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">Reduction in No-Shows</h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Average reduction reported by healthcare providers after 3 months
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 md:gap-5 p-3 md:p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-blue-100 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-lg md:text-xl font-bold flex items-center justify-center">23%</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">More Patient Capacity</h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Increased throughput without increasing staff or hours
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 md:gap-5 p-3 md:p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-purple-100 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-lg md:text-xl font-bold flex items-center justify-center">4.8</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">Patient Satisfaction Score</h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Average rating from patients using our reminder system
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -z-10 w-60 h-60 md:w-72 md:h-72 bg-blue-200 rounded-full blur-3xl opacity-20 -top-10 -left-10"></div>
                <div className="absolute -z-10 w-48 h-48 md:w-60 md:h-60 bg-health-200 rounded-full blur-3xl opacity-20 -bottom-10 -right-10"></div>
                
                {/* Chart-like decoration */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl shadow-lg flex items-center justify-center p-3 md:p-4 border border-gray-100">
                  <div className="w-full h-full relative">
                    <div className="absolute bottom-0 left-0 w-4 md:w-6 h-10 md:h-14 bg-health-200 rounded-sm"></div>
                    <div className="absolute bottom-0 left-6 md:left-8 w-4 md:w-6 h-8 md:h-10 bg-health-300 rounded-sm"></div>
                    <div className="absolute bottom-0 left-12 md:left-16 w-4 md:w-6 h-14 md:h-18 bg-health-500 rounded-sm"></div>
                    <div className="absolute bottom-0 left-18 md:left-24 w-4 md:w-6 h-12 md:h-16 bg-health-400 rounded-sm"></div>
                    <div className="absolute top-0 left-0 w-full text-[10px] md:text-xs text-gray-500 text-center">
                      Efficiency
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
          
          <div className="order-1 lg:order-2">
            <FadeIn>
              <span className="bg-health-100 text-health-800 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium inline-block mb-3 md:mb-4">
                Tangible Results
              </span>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Transform Your Practice with Data-Driven Insights
              </h2>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8">
                Our platform doesn't just send reminders—it delivers measurable improvements across your entire practice.
              </p>
            </FadeIn>
            
            <div className="space-y-3 md:space-y-4">
              {[
                "Reduce operational costs by automating manual reminder calls",
                "Free up staff time for higher-value patient interactions",
                "Improve revenue by filling canceled appointments quickly",
                "Enhance patient satisfaction with timely, personalized communications",
                "Make data-driven decisions with comprehensive analytics",
                "Optimize scheduling patterns based on historical data"
              ].map((benefit, index) => (
                <FadeIn key={index} delay={0.5 + index * 0.1}>
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="bg-health-100 rounded-full p-1 mt-0.5">
                      <Check className="h-3 w-3 md:h-4 md:w-4 text-health-600" />
                    </div>
                    <p className="text-sm md:text-base text-gray-700">{benefit}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
