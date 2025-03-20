
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

interface HospitalOption {
  id: string;
  name: string;
}

const PatientSchedule = () => {
  const { user, loading, userRole, isRoleAllowed } = useAuth();
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/sign-in");
      } else {
        // Load user's hospital and clinic
        getUserHospitalInfo();
      }
    }
  }, [user, loading, navigate]);

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
        // We'll set this to null for now until we update the profiles table
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
        
        // If user is not a super admin, and we have their hospital info, select it by default
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

      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply date filters
      const today = format(new Date(), "yyyy-MM-dd");
      if (dateRange === "today") {
        query = query.eq("date", today);
      } else if (dateRange === "upcoming") {
        query = query.gte("date", today);
      } else if (dateRange === "past") {
        query = query.lt("date", today);
      }

      // Apply hospital filter if a hospital is selected
      if (selectedHospital) {
        query = query.eq("hospital", selectedHospital);
      } else if (userHospital && !isRoleAllowed(['super_admin'])) {
        // If user is not a super admin, filter by their hospital
        query = query.eq("hospital", userHospital);
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

  const markAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      // Get the current appointment data
      const { data: oldData, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the appointment status
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );

      // Create an audit log
      const { data: newData } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();
        
      if (oldData && newData) {
        await supabaseUntyped
          .from('audit_logs')
          .insert({
            user_id: user?.id,
            action: 'update',
            table_name: 'appointments',
            record_id: appointmentId,
            old_data: { status: oldData.status },
            new_data: { status }
          });
      }

      toast.success(`Appointment marked as ${status}`);
    } catch (error: any) {
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
      // Assuming timeString is in format "HH:MM"
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, "h:mm a");
    } catch (e) {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Schedule</h1>
              <p className="text-gray-600">Manage and view all patient appointments</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/new-appointment")}
                className="bg-health-600 hover:bg-health-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <Select
                value={dateRange}
                onValueChange={setDateRange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRoleAllowed(['super_admin', 'hospital_admin']) && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital
                </label>
                <Select
                  value={selectedHospital || ""}
                  onValueChange={(value) => setSelectedHospital(value === "" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select hospital" />
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

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
              <p className="text-gray-500 mb-4">
                There are no appointments matching your filters.
              </p>
              <Button
                onClick={() => navigate("/new-appointment")}
                className="bg-health-600 hover:bg-health-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Appointment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <div className="font-medium">{appointment.patient_name}</div>
                            <div className="text-sm text-gray-500">{appointment.patient_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {formatDate(appointment.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          {formatTime(appointment.time)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={appointment.purpose}>
                          {appointment.purpose}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {appointment.status === "scheduled" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() =>
                                  markAppointmentStatus(appointment.id, "completed")
                                }
                              >
                                Complete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() =>
                                  markAppointmentStatus(appointment.id, "cancelled")
                                }
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                onClick={() =>
                                  markAppointmentStatus(appointment.id, "no-show")
                                }
                              >
                                No Show
                              </Button>
                            </>
                          )}
                          {appointment.status !== "scheduled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() =>
                                markAppointmentStatus(appointment.id, "scheduled")
                              }
                            >
                              Reschedule
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PatientSchedule;
