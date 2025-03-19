
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { usePatientStore, PatientAppointment, getPatientById } from "@/lib/patientDataService";
import { Calendar, Clock, User, FileText, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PatientSchedule = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const getSortedAppointmentsByDate = usePatientStore((state) => state.getSortedAppointmentsByDate);
  const updateAppointmentStatus = usePatientStore((state) => state.updateAppointmentStatus);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);

  // Load appointments for the selected date
  useEffect(() => {
    if (selectedDate) {
      const appointmentsForDate = getSortedAppointmentsByDate(selectedDate);
      setAppointments(appointmentsForDate);
    }
  }, [selectedDate, getSortedAppointmentsByDate]);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  // Handle appointment status toggle
  const handleStatusToggle = (id: string, currentStatus: 'pending' | 'attended') => {
    const newStatus = currentStatus === 'pending' ? 'attended' : 'pending';
    updateAppointmentStatus(id, newStatus);
    
    // Update local state
    const updatedAppointments = appointments.map(appointment => 
      appointment.id === id ? { ...appointment, status: newStatus as 'pending' | 'attended' } : appointment
    );
    setAppointments(updatedAppointments);
  };

  if (loading) {
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
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Schedule</h1>
          
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Calendar className="h-5 w-5 text-health-600" />
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-health-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Pending: {appointments.filter(a => a.status === 'pending').length}</span>
                </span>
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Attended: {appointments.filter(a => a.status === 'attended').length}</span>
                </span>
              </Badge>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="attended">Attended</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {renderAppointmentsList(appointments, handleStatusToggle)}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {renderAppointmentsList(appointments.filter(a => a.status === 'pending'), handleStatusToggle)}
            </TabsContent>
            
            <TabsContent value="attended" className="space-y-4">
              {renderAppointmentsList(appointments.filter(a => a.status === 'attended'), handleStatusToggle)}
            </TabsContent>
          </Tabs>
          
          {appointments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No appointments scheduled for this date</p>
              <p className="text-sm">Select a different date or add an appointment</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Helper function to render appointments list
const renderAppointmentsList = (
  appointments: PatientAppointment[], 
  handleStatusToggle: (id: string, status: 'pending' | 'attended') => void
) => {
  return appointments.map((appointment) => {
    const patient = getPatientById(appointment.patientId);
    
    return (
      <Card key={appointment.id} className="p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${appointment.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {appointment.status === 'pending' ? (
                <Clock className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{patient?.name}</h3>
                <Badge 
                  variant="outline" 
                  className={`${appointment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}
                >
                  {appointment.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appointment.time}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {appointment.purpose}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1"
              onClick={() => handleStatusToggle(appointment.id, appointment.status)}
            >
              {appointment.status === 'pending' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Attended</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Mark Pending</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  });
};

export default PatientSchedule;
