
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { PatientAppointment } from "@/lib/patientDataService";
import { Calendar, Clock, User, FileText, CheckCircle2, XCircle, Filter, Hospital, Building } from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReviewDateModal from "@/components/ReviewDateModal";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define type for the database appointment that matches the actual return from Supabase
interface DbAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  time: string;
  purpose: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  next_review_date?: string;
  hospital?: string;
  clinic?: string;
}

// Interface for profile data
interface ProfileData {
  hospital: string | null;
  clinic: string | null;
}

const PatientSchedule = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({ hospital: null, clinic: null });
  const [purposeFilter, setPurposeFilter] = useState<string>("");
  const [uniquePurposes, setUniquePurposes] = useState<string[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string>("");

  // Fetch user profile to get hospital and clinic
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('hospital, clinic')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile({
        hospital: data.hospital,
        clinic: data.clinic
      });
    };
    
    fetchUserProfile();
  }, [user]);

  // Load appointments for the selected date from Supabase
  useEffect(() => {
    if (selectedDate && profile.hospital && profile.clinic) {
      fetchAppointments(selectedDate);
    } else if (selectedDate && user) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate, profile, user]);

  // Fetch appointments for a specific date from Supabase
  const fetchAppointments = async (date: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate);
      
      // Filter by hospital and clinic if available
      if (profile.hospital) {
        query = query.eq('hospital', profile.hospital);
      }
      
      if (profile.clinic) {
        query = query.eq('clinic', profile.clinic);
      }
      
      // Order by time
      query = query.order('time');
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      // Collect unique purposes for filtering
      if (data) {
        const purposes = [...new Set(data.map((appointment: DbAppointment) => appointment.purpose))];
        setUniquePurposes(purposes);
      }

      // Convert database appointments to the PatientAppointment type
      if (data) {
        const formattedAppointments: PatientAppointment[] = data.map((appointment: DbAppointment) => ({
          id: appointment.id,
          patientId: appointment.patient_id,
          date: appointment.date,
          time: appointment.time,
          purpose: appointment.purpose,
          // Cast the status to either 'pending' or 'attended'
          status: appointment.status === 'attended' ? 'attended' : 'pending',
          notes: appointment.notes,
          patientName: appointment.patient_name,
          nextReviewDate: appointment.next_review_date,
          hospital: appointment.hospital,
          clinic: appointment.clinic
        }));

        // Filter appointments by purpose if filter is set
        let filteredAppointments = formattedAppointments;
        if (purposeFilter) {
          filteredAppointments = formattedAppointments.filter(
            (appointment) => appointment.purpose === purposeFilter
          );
        }

        // Sort appointments by status (pending first) and then by time
        const sortedAppointments = filteredAppointments.sort((a, b) => {
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

  // Handle appointment status toggle and open review modal
  const handleStatusToggle = (id: string, currentStatus: 'pending' | 'attended') => {
    // Only show the modal when marking as attended
    if (currentStatus === 'pending') {
      setCurrentAppointmentId(id);
      setIsReviewModalOpen(true);
    } else {
      // If marking as pending, don't need next review
      updateAppointmentStatus(id, 'pending');
    }
  };

  // Save next review date and update appointment status
  const handleSaveReviewDate = async (reviewDate: string) => {
    await updateAppointmentStatus(currentAppointmentId, 'attended', reviewDate);
  };

  // Update the appointment status in Supabase
  const updateAppointmentStatus = async (
    id: string, 
    newStatus: 'pending' | 'attended',
    nextReviewDate?: string
  ) => {
    try {
      // Create update object
      const updateData: { status: string; next_review_date?: string } = { 
        status: newStatus
      };
      
      // Add next review date if provided
      if (nextReviewDate) {
        updateData.next_review_date = nextReviewDate;
      }
      
      // Update the appointment status in Supabase
      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === id ? { 
          ...appointment, 
          status: newStatus, 
          ...(nextReviewDate && { nextReviewDate })
        } : appointment
      );
      setAppointments(updatedAppointments);
      
      toast.success(`Appointment marked as ${newStatus}${nextReviewDate ? ` with next review on ${nextReviewDate}` : ''}`);
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

  // Apply purpose filter
  const handleFilterChange = (purpose: string) => {
    setPurposeFilter(purpose === purposeFilter ? "" : purpose);
    // Reapply the filter
    fetchAppointments(selectedDate);
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Schedule</h1>
              
              {/* Display hospital and clinic information */}
              {profile.hospital && (
                <div className="flex items-center gap-1 text-gray-600 mt-1">
                  <Hospital className="h-4 w-4" />
                  <span className="font-medium">{profile.hospital}</span>
                  {profile.clinic && (
                    <>
                      <span className="mx-1">-</span>
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{profile.clinic}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-health-600" />
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-health-500"
              />
            </div>
            
            {/* Purpose filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {purposeFilter ? `Filtered: ${purposeFilter}` : "Filter by Purpose"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <h3 className="font-medium">Filter by Purpose</h3>
                  <div className="flex flex-col gap-1">
                    {uniquePurposes.map((purpose) => (
                      <Button
                        key={purpose}
                        variant={purposeFilter === purpose ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => handleFilterChange(purpose)}
                      >
                        {purpose}
                      </Button>
                    ))}
                    {purposeFilter && (
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setPurposeFilter("")}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
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
                
                <TabsContent value="all">
                  <AppointmentsTable 
                    appointments={appointments}
                    handleStatusToggle={handleStatusToggle}
                  />
                </TabsContent>
                
                <TabsContent value="pending">
                  <AppointmentsTable 
                    appointments={appointments.filter(a => a.status === 'pending')}
                    handleStatusToggle={handleStatusToggle}
                  />
                </TabsContent>
                
                <TabsContent value="attended">
                  <AppointmentsTable 
                    appointments={appointments.filter(a => a.status === 'attended')}
                    handleStatusToggle={handleStatusToggle}
                  />
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
      
      {/* Review Date Modal */}
      <ReviewDateModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSave={handleSaveReviewDate}
        appointmentId={currentAppointmentId}
      />
      
      <Footer />
    </div>
  );
};

// Appointments table component to reduce complexity
const AppointmentsTable = ({ 
  appointments, 
  handleStatusToggle 
}: { 
  appointments: PatientAppointment[],
  handleStatusToggle: (id: string, status: 'pending' | 'attended') => void
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Next Review</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`${appointment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}
                >
                  {appointment.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{appointment.patientName}</TableCell>
              <TableCell>{appointment.time}</TableCell>
              <TableCell>{appointment.purpose}</TableCell>
              <TableCell>{appointment.nextReviewDate || '-'}</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientSchedule;
