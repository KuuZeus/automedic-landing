
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
import {
  CalendarClock,
  Users,
  LineChart as LineChartIcon,
  LayoutDashboard,
  Edit2,
  Activity,
  Clipboard,
  Hospital,
  UserCircle,
  Mail,
  BarChart as BarChartIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
  const [appointmentsByMonth, setAppointmentsByMonth] = useState([]);
  const navigate = useNavigate();

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

          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('status, purpose, date');

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

            // Prepare data for bar chart by purpose
            const purposeGroups = {};
            appointmentsData.forEach(app => {
              purposeGroups[app.purpose] = (purposeGroups[app.purpose] || 0) + 1;
            });
            
            const purposeData = Object.entries(purposeGroups).map(([name, value]) => ({
              name,
              value
            }));
            setAppointmentsByPurpose(purposeData);

            // Process data for monthly trends with multiple status lines
            const months = {};
            appointmentsData.forEach(app => {
              const date = new Date(app.date);
              const monthYear = `${date.toLocaleString('default', { month: 'short' })}`;
              
              if (!months[monthYear]) {
                months[monthYear] = {
                  attended: 0,
                  missed: 0,
                  canceled: 0
                };
              }
              
              if (app.status === 'attended') {
                months[monthYear].attended += 1;
              } else if (app.status === 'canceled') {
                months[monthYear].canceled += 1;
              } else if (app.status === 'pending') {
                months[monthYear].missed += 1; // Using pending as missed for demonstration
              }
            });
            
            const monthData = Object.entries(months).map(([name, stats]) => ({
              name,
              attended: stats.attended,
              missed: stats.missed,
              canceled: stats.canceled
            }));
            
            setAppointmentsByMonth(monthData);
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
                        <Clipboard className="h-4 w-4 text-health-600 mr-1" />
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
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
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
                
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointmentsByMonth.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={appointmentsByMonth}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="appointments" fill="#0369a1" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
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
                    )}
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
                      
                      {appointmentsByPurpose.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-md font-medium mb-4">Appointments by Purpose</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={appointmentsByPurpose}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip 
                                  formatter={(value, name) => [`${value} appointments`, 'Total']}
                                  labelFormatter={(label) => `Purpose: ${label}`}
                                />
                                <Legend />
                                <Bar 
                                  dataKey="value" 
                                  name="Appointments" 
                                  fill="#0369a1"
                                  radius={[4, 4, 0, 0]}
                                >
                                  {appointmentsByPurpose.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      
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
                    {appointmentsByMonth.length > 0 ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-md font-medium mb-4">Monthly Appointment Trends</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={appointmentsByMonth}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="attended"
                                  stroke="#00C49F"
                                  activeDot={{ r: 8 }}
                                  name="Attended"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="missed"
                                  stroke="#0088FE"
                                  name="Missed"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="canceled"
                                  stroke="#FF8042"
                                  name="Canceled"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-md font-medium mb-4">Appointment Distribution</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Pending', value: appointmentStats.pending },
                                    { name: 'Attended', value: appointmentStats.attended },
                                    { name: 'Canceled', value: appointmentStats.canceled }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="#0088FE" />
                                  <Cell fill="#00C49F" />
                                  <Cell fill="#FF8042" />
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <LineChartIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">
                          Detailed analytics about your appointments and patient care metrics will be displayed here as you continue to use the platform.
                        </p>
                      </div>
                    )}
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

export default Dashboard;
