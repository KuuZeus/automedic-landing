
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { PatientAppointment } from "@/lib/patientDataService";
import { Calendar, Clock, User, FileText, CheckCircle2, XCircle } from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define type for the database appointment
interface DbAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  time: string;
  purpose: string;
  status: 'pending' | 'attended';
  notes?: string;
}

const PatientSchedule = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load appointments for the selected date from Supabase
  useEffect(() => {
    if (selectedDate) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate]);

  // Fetch appointments for a specific date from Supabase
  const fetchAppointments = async (date: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate)
        .order('time');
      
      if (error) {
        throw error;
      }

      // Convert database appointments to the PatientAppointment type
      if (data) {
        const formattedAppointments: PatientAppointment[] = data.map((appointment: DbAppointment) => ({
          id: appointment.id,
          patientId: appointment.patient_id,
          date: appointment.date,
          time: appointment.time,
          purpose: appointment.purpose,
          status: appointment.status,
          notes: appointment.notes,
          patientName: appointment.patient_name
        }));

        // Sort appointments by status (pending first) and then by time
        const sortedAppointments = formattedAppointments.sort((a, b) => {
          // First sort by status
          if (a.status === 'pending' && b.status === 'attended') return -1;
          if (a.status === 'attended' && b.status === 'pending') return 1;
          
          // If status is the same, sort by time
          const timeA = convertTimeToMinutes(a.time);
          const timeB = convertTimeToMinutes(b.time);
          return timeA - timeB;
        });

        setAppointments(sortedAppointments);
      }
    } catch (error: any) {
      toast.error(`Error fetching appointments: ${error.message}`);
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle appointment status toggle
  const handleStatusToggle = async (id: string, currentStatus: 'pending' | 'attended') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'attended' : 'pending';
      
      // Update the appointment status in Supabase
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === id ? { ...appointment, status: newStatus as 'pending' | 'attended' } : appointment
      );
      setAppointments(updatedAppointments);
      
      toast.success(`Appointment marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(`Error updating status: ${error.message}`);
      console.error('Error updating appointment status:', error);
    }
  };

  // Helper function to convert time string (e.g., "9:00 AM") to minutes for sorting
  const convertTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format for easier comparison
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

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
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-health-600"></div>
            </div>
          ) : (
            <>
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
            </>
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
                <h3 className="font-medium">{appointment.patientName}</h3>
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
