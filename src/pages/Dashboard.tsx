
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCircle,
  Mail,
  Hospital,
  Edit2,
  ClipboardList
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [hospital, setHospital] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    pending: 0,
    attended: 0,
    canceled: 0
  });
  const [appointmentsByPurpose, setAppointmentsByPurpose] = useState([]);
  const navigate = useNavigate();

  // Define specific colors for common visit purposes
  const PURPOSE_COLORS = {
    'Follow up': '#9b87f5',
    'Medication review': '#0EA5E9',
    'Annual checkup': '#F97316',
    'Vaccination': '#D946EF',
    'Consultation': '#8B5CF6',
    'Lab review': '#6E59A5',
    'Physical exam': '#7E69AB',
    'Chronic disease management': '#D6BCFA'
  };
  
  // Default colors for any purposes not in the specific map
  const DEFAULT_COLORS = ['#9b87f5', '#0EA5E9', '#F97316', '#D946EF', '#8B5CF6', '#6E59A5'];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setIsLoading(true);
        try {
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
            setHospital(profileData.hospital || "");
            setRole(profileData.role || "User");
          }

          // Only fetch appointments where this user personally attended
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('status, purpose, date')
            .or(`doctor_id.eq.${user.id}`);

          if (appointmentsError) throw appointmentsError;

          if (appointmentsData) {
            const totalCount = appointmentsData.length;
            const pendingCount = appointmentsData.filter(app => app.status === 'pending').length;
            const attendedCount = appointmentsData.filter(app => app.status === 'attended').length;
            const canceledCount = appointmentsData.filter(app => app.status === 'canceled').length;
            
            setAppointmentStats({
              total: totalCount,
              pending: pendingCount,
              attended: attendedCount,
              canceled: canceledCount
            });

            // Group appointments by purpose
            const purposeGroups: Record<string, number> = {};
            
            // Define sample purposes if no data exists
            if (appointmentsData.length === 0 || !appointmentsData.some(app => app.purpose)) {
              // Sample data for demonstration
              purposeGroups['Follow up'] = 8;
              purposeGroups['Medication review'] = 12;
              purposeGroups['Annual checkup'] = 5;
              purposeGroups['Vaccination'] = 7;
              purposeGroups['Consultation'] = 15;
              purposeGroups['Lab review'] = 4;
            } else {
              appointmentsData.forEach(app => {
                if (app.purpose) {
                  purposeGroups[app.purpose] = (purposeGroups[app.purpose] || 0) + 1;
                }
              });
            }
            
            // Create data for the chart with assigned colors
            const purposeData = Object.entries(purposeGroups).map(([name, value]) => {
              // Assign a specific color if we have one defined, otherwise use a default
              const color = PURPOSE_COLORS[name] || DEFAULT_COLORS[Object.keys(purposeGroups).indexOf(name) % DEFAULT_COLORS.length];
              return {
                name,
                value,
                fill: color
              };
            });
            
            setAppointmentsByPurpose(purposeData);
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
      console.log("Updating profile with data:", {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        specialty: specialty,
        clinic: clinic,
        hospital: hospital,
        role: role
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          specialty: specialty,
          clinic: clinic,
          hospital: hospital,
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="w-full">
                    <h3 className="text-xl font-medium text-center mb-2">
                      {firstName || lastName ? `${firstName} ${lastName}` : user.email}
                    </h3>
                    <div className="flex items-center justify-center mt-1 mb-4">
                      <UserCircle className="h-4 w-4 text-health-600 mr-1" />
                      <p className="text-gray-500">{role || "User"}</p>
                    </div>
                    {specialty && (
                      <div className="flex items-center justify-center mt-1 mb-4">
                        <ClipboardList className="h-4 w-4 text-health-600 mr-1" />
                        <p className="text-gray-500">{specialty}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-left">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-health-600 mr-2" />
                        <div>
                          <span className="font-medium text-sm text-gray-700">Email: </span>
                          <span className="text-gray-600">{user.email}</span>
                        </div>
                      </div>
                      
                      {clinic && (
                        <div className="flex items-center">
                          <Hospital className="h-4 w-4 text-health-600 mr-2" />
                          <div>
                            <span className="font-medium text-sm text-gray-700">Clinic: </span>
                            <span className="text-gray-600">{clinic}</span>
                          </div>
                        </div>
                      )}
                      
                      {hospital && (
                        <div className="flex items-center">
                          <Hospital className="h-4 w-4 text-health-600 mr-2" />
                          <div>
                            <span className="font-medium text-sm text-gray-700">Hospital: </span>
                            <span className="text-gray-600">{hospital}</span>
                          </div>
                        </div>
                      )}
                    </div>
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
                      <Label htmlFor="role">Role</Label>
                      <Input 
                        id="role" 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)} 
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
                      <Label htmlFor="clinic">Clinic</Label>
                      <Input 
                        id="clinic" 
                        value={clinic} 
                        onChange={(e) => setClinic(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="hospital">Hospital</Label>
                      <Input 
                        id="hospital" 
                        value={hospital} 
                        onChange={(e) => setHospital(e.target.value)} 
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

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Canceled</CardDescription>
                        <CardTitle className="text-3xl">{appointmentStats.canceled}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          Appointments canceled
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-4">Appointments by Purpose of Visit</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={appointmentsByPurpose}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70} 
                            label={{ value: 'Purpose of Visit', position: 'insideBottom', offset: -35 }}
                          />
                          <YAxis 
                            allowDecimals={false} 
                            label={{ value: 'Number of Appointments', angle: -90, position: 'insideLeft' }}
                          />
                          <RechartsTooltip 
                            formatter={(value) => [`${value} appointments`, 'Total']}
                            labelFormatter={(label) => `Purpose: ${label}`}
                          />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="top" 
                            align="center"
                            wrapperStyle={{ paddingBottom: '10px' }}
                          />
                          <Bar 
                            dataKey="value" 
                            name="Appointments" 
                            radius={[4, 4, 0, 0]}
                          >
                            {appointmentsByPurpose.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
