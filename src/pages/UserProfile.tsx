
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, Users, LineChart, LayoutDashboard, UserCircle, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserProfile = () => {
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    pending: 0,
    attended: 0
  });
  const navigate = useNavigate();

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  // Fetch user profile data and stats
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;
          
          if (profileData) {
            setFirstName(profileData.first_name || "");
            setLastName(profileData.last_name || "");
            setSpecialty(profileData.specialty || "");
            setClinic(profileData.clinic || "");
          }

          // Fetch appointment statistics
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('status');

          if (appointmentsError) throw appointmentsError;

          if (appointmentsData) {
            const totalCount = appointmentsData.length;
            const pendingCount = appointmentsData.filter(app => app.status === 'pending').length;
            const attendedCount = appointmentsData.filter(app => app.status === 'attended').length;
            
            setAppointmentStats({
              total: totalCount,
              pending: pendingCount,
              attended: attendedCount
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load user data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          specialty: specialty,
          clinic: clinic,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  // Return early if user is not authenticated
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Profile & Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Personal Details</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src="" alt={`${firstName} ${lastName}`} />
                  <AvatarFallback className="text-lg bg-health-100 text-health-700">
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {!isEditing ? (
                  <div className="text-center">
                    <h3 className="text-xl font-medium">
                      {firstName || lastName ? `${firstName} ${lastName}` : user.email}
                    </h3>
                    {specialty && <p className="text-gray-500">{specialty}</p>}
                    {clinic && <p className="text-gray-500">{clinic}</p>}
                    <p className="text-gray-500 text-sm mt-2">{user.email}</p>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialty">Specialty</Label>
                      <Input 
                        id="specialty" 
                        value={specialty} 
                        onChange={(e) => setSpecialty(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="clinic">Clinic/Hospital</Label>
                      <Input 
                        id="clinic" 
                        value={clinic} 
                        onChange={(e) => setClinic(e.target.value)} 
                      />
                    </div>
                    <Button 
                      className="w-full bg-health-600 hover:bg-health-700" 
                      onClick={handleUpdateProfile}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Overview */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <LineChart className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Appointments</CardDescription>
                      <CardTitle className="text-3xl">{appointmentStats.total}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Across all time
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Pending</CardDescription>
                      <CardTitle className="text-3xl">{appointmentStats.pending}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Appointments to attend
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Completed</CardDescription>
                      <CardTitle className="text-3xl">{appointmentStats.attended}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Appointments attended
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        Your recent activity and personal analytics will appear here as you use the platform.
                      </p>
                      <Button 
                        className="mt-4 bg-health-600 hover:bg-health-700"
                        onClick={() => navigate('/patient-schedule')}
                      >
                        Go to Patient Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appointments">
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CalendarClock className="h-5 w-5 text-health-600 mr-3" />
                          <div>
                            <p className="font-medium">Pending Appointments</p>
                            <p className="text-sm text-gray-500">Scheduled for future dates</p>
                          </div>
                        </div>
                        <span className="text-xl font-semibold">{appointmentStats.pending}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-health-600 mr-3" />
                          <div>
                            <p className="font-medium">Attended Appointments</p>
                            <p className="text-sm text-gray-500">Successfully completed</p>
                          </div>
                        </div>
                        <span className="text-xl font-semibold">{appointmentStats.attended}</span>
                      </div>
                      
                      <Button 
                        className="w-full bg-health-600 hover:bg-health-700"
                        onClick={() => navigate('/patient-schedule')}
                      >
                        View Full Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <LineChart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600">
                        Detailed analytics about your appointments and patient care metrics will be displayed here as you continue to use the platform.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
