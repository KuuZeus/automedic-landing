
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  LayoutDashboard, 
  LogOut, 
  RefreshCw, 
  Menu, 
  X, 
  Users,
  Settings,
  BarChart,
  Building,
  Shield
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const AuthNav = () => {
  const { signOut, user, userRole, canManageUsers, canManageAppointments, canViewAnalytics, canManageSettings } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={userRole === 'analytics_viewer' ? "/dashboard" : "/patient-schedule"} className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-health-600" strokeWidth={2.5} />
              <span className="text-lg sm:text-2xl font-semibold bg-gradient-to-r from-health-700 to-health-500 bg-clip-text text-transparent">
                SynchoraHealth
              </span>
            </Link>
          </div>
          
          {/* Role Badge */}
          <div className="hidden md:flex items-center mr-4">
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              {userRole === 'super_admin' ? 'Super Admin' : 
               userRole === 'hospital_admin' ? 'Hospital Admin' : 
               userRole === 'appointment_manager' ? 'Appointment Manager' : 
               'Analytics Viewer'}
            </div>
          </div>
          
          {isMobile ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 sm:w-80">
                <nav className="flex flex-col space-y-4 mt-8">
                  {/* Role Badge (Mobile) */}
                  <div className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 flex items-center mb-4">
                    <Shield className="h-4 w-4 mr-2" />
                    {userRole === 'super_admin' ? 'Super Admin' : 
                     userRole === 'hospital_admin' ? 'Hospital Admin' : 
                     userRole === 'appointment_manager' ? 'Appointment Manager' : 
                     'Analytics Viewer'}
                  </div>
                  
                  {canManageAppointments() && (
                    <Link to="/patient-schedule" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant={location.pathname === "/patient-schedule" ? "default" : "ghost"} 
                        size="sm"
                        className={`w-full justify-start ${location.pathname === "/patient-schedule" ? "bg-health-600 hover:bg-health-700" : ""}`}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Schedule</span>
                      </Button>
                    </Link>
                  )}
                  
                  {canViewAnalytics() && (
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant={location.pathname === "/dashboard" ? "default" : "ghost"} 
                        size="sm"
                        className={`w-full justify-start ${location.pathname === "/dashboard" ? "bg-health-600 hover:bg-health-700" : ""}`}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span>Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  
                  {canManageUsers() && (
                    <Link to="/users" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant={location.pathname === "/users" ? "default" : "ghost"} 
                        size="sm"
                        className={`w-full justify-start ${location.pathname === "/users" ? "bg-health-600 hover:bg-health-700" : ""}`}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        <span>Users</span>
                      </Button>
                    </Link>
                  )}
                  
                  {canManageSettings() && (
                    <Link to="/settings" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant={location.pathname === "/settings" ? "default" : "ghost"} 
                        size="sm"
                        className={`w-full justify-start ${location.pathname === "/settings" ? "bg-health-600 hover:bg-health-700" : ""}`}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        <span>Settings</span>
                      </Button>
                    </Link>
                  )}
                  
                  {userRole === 'super_admin' && (
                    <Link to="/hospitals" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant={location.pathname === "/hospitals" ? "default" : "ghost"} 
                        size="sm"
                        className={`w-full justify-start ${location.pathname === "/hospitals" ? "bg-health-600 hover:bg-health-700" : ""}`}
                      >
                        <Building className="h-4 w-4 mr-2" />
                        <span>Hospitals</span>
                      </Button>
                    </Link>
                  )}
                  
                  {userRole === 'super_admin' && (
                    <Link to="/audit-logs" onClick={() => setIsOpen(false)}>
                      <Button 
                        variant={location.pathname === "/audit-logs" ? "default" : "ghost"} 
                        size="sm"
                        className={`w-full justify-start ${location.pathname === "/audit-logs" ? "bg-health-600 hover:bg-health-700" : ""}`}
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        <span>Audit Logs</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <nav className="flex items-center space-x-1 md:space-x-4">
              {canManageAppointments() && (
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
              )}
              
              {canViewAnalytics() && (
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
              )}
              
              {canManageUsers() && (
                <Link to="/users">
                  <Button 
                    variant={location.pathname === "/users" ? "default" : "ghost"} 
                    size="sm"
                    className={location.pathname === "/users" ? "bg-health-600 hover:bg-health-700" : ""}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Users</span>
                  </Button>
                </Link>
              )}
              
              {canManageSettings() && (
                <Link to="/settings">
                  <Button 
                    variant={location.pathname === "/settings" ? "default" : "ghost"} 
                    size="sm"
                    className={location.pathname === "/settings" ? "bg-health-600 hover:bg-health-700" : ""}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Settings</span>
                  </Button>
                </Link>
              )}
              
              {userRole === 'super_admin' && (
                <Link to="/hospitals">
                  <Button 
                    variant={location.pathname === "/hospitals" ? "default" : "ghost"} 
                    size="sm"
                    className={location.pathname === "/hospitals" ? "bg-health-600 hover:bg-health-700" : ""}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Hospitals</span>
                  </Button>
                </Link>
              )}
              
              {userRole === 'super_admin' && (
                <Link to="/audit-logs">
                  <Button 
                    variant={location.pathname === "/audit-logs" ? "default" : "ghost"} 
                    size="sm"
                    className={location.pathname === "/audit-logs" ? "bg-health-600 hover:bg-health-700" : ""}
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Audit Logs</span>
                  </Button>
                </Link>
              )}
              
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default AuthNav;
