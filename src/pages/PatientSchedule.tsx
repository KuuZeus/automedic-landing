
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/lib/supabaseTypes";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, Filter, Plus, User, Home, Calendar as CalendarIcon } from "lucide-react";
import ReviewDateModal from "@/components/ReviewDateModal";
import { createAuditLog } from "@/lib/auditLogService";

interface HospitalOption {
  id: string;
  name: string;
}

const PatientSchedule = () => {
  const { user, loading, userRole, canManageAppointments } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("upcoming");
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [userHospital, setUserHospital] = useState<string | null>(null);
  const [userClinic, setUserClinic] = useState<string | null>(null);
  const [userHospitalId, setUserHospitalId] = useState<string | null>(null);

  // Review Date Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/sign-in");
      } else if (userRole === 'analytics_viewer') {
        navigate("/dashboard");
        toast.error("You don't have permission to access the appointments page");
      } else {
        getUserHospitalInfo();
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    if (user && !loading) {
      fetchHospitals();
      fetchAppointments();
    }
  }, [user, loading, statusFilter, dateRange, selectedHospital]);

  const getUserHospitalInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hospital, clinic')
        .eq('id', user?.id || '')
        .single();

      if (error) throw error;

      if (data) {
        setUserHospital(data.hospital);
        setUserClinic(data.clinic);
        setUserHospitalId(null);
      }
    } catch (error) {
      console.error('Error fetching user hospital info:', error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabaseUntyped
        .from('hospitals')
        .select('id, name')
        .order('name');

      if (error) throw error;

      if (data) {
        const hospitalOptions = data.map((hospital: any) => ({
          id: hospital.id,
          name: hospital.name
        }));
        
        setHospitals(hospitalOptions as HospitalOption[]);
        
        if (!isRoleAllowed(['super_admin']) && userHospital && !selectedHospital) {
          const found = hospitalOptions.find((h: any) => h.name === userHospital);
          if (found) {
            setSelectedHospital(found.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: false })
        .order("time", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const today = format(new Date(), "yyyy-MM-dd");
      if (dateRange === "today") {
        query = query.eq("date", today);
      } else if (dateRange === "upcoming") {
        query = query.gte("date", today);
      } else if (dateRange === "past") {
        query = query.lt("date", today);
      }

      // Filter by hospital if the user is not a super_admin
      if (selectedHospital) {
        query = query.eq("hospital", selectedHospital);
      } else if (userHospital && !isRoleAllowed(['super_admin'])) {
        query = query.eq("hospital", userHospital);
      }
      
      // If user is an appointment manager, only show appointments for their clinic
      if (userRole === 'appointment_manager' && userClinic) {
        query = query.eq("clinic", userClinic);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (appointmentId: string, status: string) => {
    console.log("Changing status for appointment:", appointmentId, "to:", status);
    if (status === "completed") {
      setSelectedAppointmentId(appointmentId);
      setIsReviewModalOpen(true);
    } else {
      markAppointmentStatus(appointmentId, status);
    }
  };

  const handleSaveReviewDate = async (reviewDate: string) => {
    if (!selectedAppointmentId) return;
    
    try {
      // First mark the appointment as completed
      await markAppointmentStatus(selectedAppointmentId, "completed");
      
      // Then update the next review date
      const { error } = await supabase
        .from("appointments")
        .update({ next_review_date: reviewDate })
        .eq("id", selectedAppointmentId);
        
      if (error) throw error;
      
      toast.success("Appointment completed and next review scheduled");
      
      // Update the local state
      setAppointments(appointments.map(appointment => 
        appointment.id === selectedAppointmentId 
          ? { ...appointment, status: "completed", next_review_date: reviewDate }
          : appointment
      ));
      
    } catch (error: any) {
      toast.error(error.message || "Failed to save review date");
    } finally {
      setIsReviewModalOpen(false);
      setSelectedAppointmentId(null);
    }
  };

  const markAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      console.log("Marking appointment status in DB:", appointmentId, status);
      
      const { data: oldData, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state immediately for better UX
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );

      // Fetch the updated appointment data to use in the audit log
      const { data: newData } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();
        
      if (oldData && newData) {
        await createAuditLog(
          'update',
          'appointments',
          appointmentId,
          { status: oldData.status },
          { status }
        );
      }

      toast.success(`Appointment marked as ${status}`);
      
      // Refresh appointments data to ensure we have the latest
      fetchAppointments();
      
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      toast.error(error.message || "Failed to update appointment status");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no-show":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const isRoleAllowed = (allowedRoles: string[]) => {
    return allowedRoles.includes(userRole || '');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNav />
      <div className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Patient Appointments</h1>
          {canManageAppointments && (
            <Button onClick={() => navigate("/new-appointment")}>
              <Plus className="h-4 w-4 mr-2" /> New Appointment
            </Button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-filter" className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="all">All Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRoleAllowed(['super_admin']) && (
              <div className="flex-1">
                <label htmlFor="hospital-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital
                </label>
                <Select value={selectedHospital || ""} onValueChange={setSelectedHospital}>
                  <SelectTrigger id="hospital-filter" className="w-full">
                    <SelectValue placeholder="All Hospitals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Hospitals</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter !== "all" || dateRange !== "all"
                ? "Try changing your filters to see more appointments."
                : "Start by creating a new appointment."}
            </p>
            {canManageAppointments && (
              <div className="mt-6">
                <Button onClick={() => navigate("/new-appointment")}>
                  <Plus className="h-4 w-4 mr-2" /> New Appointment
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.patient_name}
                      </TableCell>
                      <TableCell>{formatDate(appointment.date)}</TableCell>
                      <TableCell>{formatTime(appointment.time)}</TableCell>
                      <TableCell>{appointment.purpose || "Not specified"}</TableCell>
                      <TableCell>{appointment.specialty || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageAppointments && appointment.status === "scheduled" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(appointment.id, "completed")}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(appointment.id, "no-show")}
                            >
                              No Show
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(appointment.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
      
      {/* Review Date Modal */}
      <ReviewDateModal 
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedAppointmentId(null);
        }}
        onSave={handleSaveReviewDate}
        appointmentId={selectedAppointmentId || ""}
      />
      
      <Footer />
    </div>
  );
};

export default PatientSchedule;
