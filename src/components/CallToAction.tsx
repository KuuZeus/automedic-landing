
import React from "react";
import { Button } from "../components/ui/button";
import FadeIn from "./animations/FadeIn";
import { Link } from "react-router-dom";

const CallToAction: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-health-50">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <FadeIn>
            <span className="bg-health-100 text-health-800 px-4 py-1.5 rounded-full text-sm font-medium inline-block mb-4">
              Get Started Today
            </span>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that's right for your practice. All plans include our core features with no hidden fees.
            </p>
          </FadeIn>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Starter",
              price: "₵600",
              description: "Perfect for small practices",
              features: [
                "Up to 200 patients",
                "SMS & Email Reminders",
                "Basic No-Show Analytics",
                "8/5 Support"
              ],
              highlight: false,
              buttonText: "Start Free Trial"
            },
            {
              name: "Professional",
              price: "₵1,500",
              description: "Ideal for growing practices",
              features: [
                "Up to 1,000 patients",
                "Voice Call Reminders",
                "Advanced No-Show Prediction",
                "Patient Portal Integration",
                "24/7 Priority Support"
              ],
              highlight: true,
              buttonText: "Start Free Trial"
            },
            {
              name: "Enterprise",
              price: "Custom",
              description: "For large healthcare organizations",
              features: [
                "Unlimited patients",
                "Custom Integration",
                "Dedicated Account Manager",
                "Custom Analytics Dashboard",
                "SLA Guarantee"
              ],
              highlight: false,
              buttonText: "Contact Sales"
            }
          ].map((plan, index) => (
            <FadeIn key={index} delay={0.3 + index * 0.2}>
              <div className={`h-full rounded-2xl p-8 transition-all-300 ${
                plan.highlight 
                  ? "bg-white shadow-xl border-2 border-health-300 scale-105" 
                  : "bg-white/80 shadow-md hover:shadow-lg hover:bg-white"
              }`}>
                {plan.highlight && (
                  <div className="flex items-center justify-center mb-6">
                    <span className="px-4 py-1 bg-health-600 text-white text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-gray-600 ml-1">/month</span>}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`rounded-full p-1 mt-0.5 ${
                        plan.highlight ? "bg-health-100" : "bg-gray-100"
                      }`}>
                        <svg 
                          className={`h-4 w-4 ${plan.highlight ? "text-health-600" : "text-gray-500"}`}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full rounded-xl py-6 ${
                    plan.highlight 
                      ? "bg-health-600 hover:bg-health-700 text-white" 
                      : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                  }`}
                  asChild
                >
                  <Link to="/contact">{plan.buttonText}</Link>
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>
        
        <FadeIn delay={0.8}>
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">
              Need a custom solution? Our team is ready to help.
            </p>
            <Button variant="outline" className="rounded-full border-health-200 hover:border-health-300" asChild>
              <Link to="/contact">Contact Our Sales Team</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default CallToAction;
