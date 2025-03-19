
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, LayoutDashboard, LogOut } from "lucide-react";

const AuthNav = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/patient-schedule" className="flex items-center">
              <img 
                src="/lovable-uploads/df9b6056-a446-4110-afd9-43380f806621.png" 
                alt="SynchoraHealth Logo" 
                className="h-8"
              />
            </Link>
          </div>
          
          <nav className="flex items-center space-x-1 md:space-x-4">
            <Link to="/patient-schedule">
              <Button 
                variant={location.pathname === "/patient-schedule" ? "default" : "ghost"} 
                size="sm"
                className={location.pathname === "/patient-schedule" ? "bg-health-600 hover:bg-health-700" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Schedule</span>
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button 
                variant={location.pathname === "/dashboard" ? "default" : "ghost"} 
                size="sm"
                className={location.pathname === "/dashboard" ? "bg-health-600 hover:bg-health-700" : ""}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AuthNav;
