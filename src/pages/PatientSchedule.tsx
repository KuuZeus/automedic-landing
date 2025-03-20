import { useEffect } from "react";
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

      if (selectedHospital) {
        query = query.eq("hospital", selectedHospital);
      } else if (userHospital && !isRoleAllowed(['super_admin'])) {
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

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );

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
      [

