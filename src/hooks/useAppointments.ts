
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/lib/supabaseTypes";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";
import { createAuditLog } from "@/lib/auditLogService";

export const useAppointments = (userRole: string | null, userHospital: string | null, userClinic: string | null) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("upcoming");
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const isRoleAllowed = (allowedRoles: string[]) => {
    return allowedRoles.includes(userRole || '');
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
        
        setHospitals(hospitalOptions);
        
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

  // Check for overdue appointments and update their status
  const updateOverdueAppointments = async (appointmentsData: any[]) => {
    const today = new Date();
    const overdueAppointments = appointmentsData.filter(
      app => app.status.toLowerCase() === 'pending' && isPast(parseISO(app.date)) && app.date !== format(today, 'yyyy-MM-dd')
    );
    
    if (overdueAppointments.length > 0) {
      console.log(`Found ${overdueAppointments.length} overdue appointments`);
      
      for (const appointment of overdueAppointments) {
        try {
          console.log(`Marking appointment ${appointment.id} as missed`);
          
          const { error } = await supabase
            .from("appointments")
            .update({ status: "no-show" })
            .eq("id", appointment.id);
            
          if (error) throw error;
          
          // Update local state
          setAppointments(prev => 
            prev.map(app => 
              app.id === appointment.id ? { ...app, status: "Missed" } : app
            )
          );
          
          await createAuditLog(
            'update',
            'appointments',
            appointment.id,
            { status: appointment.status },
            { status: 'no-show' }
          );
        } catch (error) {
          console.error(`Error updating overdue appointment ${appointment.id}:`, error);
        }
      }
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
        console.log("Fetched appointments:", data.length);
        
        // Convert status to new format if needed
        const updatedData = data.map(appointment => {
          const status = appointment.status.toLowerCase();
          if (status === "scheduled") return { ...appointment, status: "Pending" };
          if (status === "completed") return { ...appointment, status: "Attended" };
          if (status === "no-show") return { ...appointment, status: "Missed" };
          if (status === "cancelled") return { ...appointment, status: "Cancel" };
          return appointment;
        });
        
        // Update overdue appointments in the background
        updateOverdueAppointments(updatedData);
        
        setAppointments(updatedData);
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
    if (status === "Attended") {
      setSelectedAppointmentId(appointmentId);
      setIsReviewModalOpen(true);
    } else {
      markAppointmentStatus(appointmentId, status);
    }
  };

  const handleSaveReviewDate = async (reviewDate: string | null) => {
    if (!selectedAppointmentId) return;
    
    try {
      console.log("Saving review date:", reviewDate, "for appointment:", selectedAppointmentId);
      
      // First mark the appointment as completed (now "Attended")
      await markAppointmentStatus(selectedAppointmentId, "Attended");
      
      // Then update the next review date
      const { error } = await supabase
        .from("appointments")
        .update({ next_review_date: reviewDate })
        .eq("id", selectedAppointmentId);
        
      if (error) throw error;
      
      toast.success("Appointment completed and next review " + (reviewDate ? "scheduled" : "not needed"));
      
      // Update the local state
      setAppointments(appointments.map(appointment => 
        appointment.id === selectedAppointmentId 
          ? { ...appointment, status: "Attended", next_review_date: reviewDate }
          : appointment
      ));
      
    } catch (error: any) {
      console.error("Error saving review date:", error);
      toast.error(error.message || "Failed to save review date");
    } finally {
      setIsReviewModalOpen(false);
      setSelectedAppointmentId(null);
    }
  };

  const markAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      console.log("Marking appointment status in DB:", appointmentId, status);
      
      // Get DB-compatible status based on the database constraints
      // The database expects: 'scheduled', 'completed', 'cancelled', 'no-show'
      let dbStatus = '';
      if (status === "Attended") dbStatus = "completed";
      else if (status === "Pending") dbStatus = "scheduled";
      else if (status === "Missed") dbStatus = "no-show";
      else if (status === "cancelled" || status === "Cancel") dbStatus = "cancelled";
      // Add fallback for unexpected values
      else dbStatus = status.toLowerCase();
      
      console.log("DB status to use:", dbStatus);
      
      const { data: oldData, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from("appointments")
        .update({ status: dbStatus })
        .eq("id", appointmentId);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      // Update local state immediately for better UX
      // Use the display status ("Cancel", "Attended", etc.)
      const displayStatus = status === "cancelled" ? "Cancel" : status;
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: displayStatus }
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
          { status: dbStatus }
        );
      }

      toast.success(`Appointment marked as ${displayStatus}`);
      
      // Refresh appointments data to ensure we have the latest
      fetchAppointments();
      
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      toast.error(error.message || "Failed to update appointment status");
    }
  };

  // Effects
  useEffect(() => {
    fetchHospitals();
  }, [userHospital]);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateRange, selectedHospital, userHospital, userClinic]);

  // Add an interval to regularly check for overdue appointments
  useEffect(() => {
    const checkOverdueInterval = setInterval(() => {
      if (appointments.length > 0) {
        updateOverdueAppointments(appointments);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkOverdueInterval);
  }, [appointments]);

  return {
    appointments,
    isLoading,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    selectedHospital,
    setSelectedHospital,
    hospitals,
    isReviewModalOpen,
    setIsReviewModalOpen,
    selectedAppointmentId,
    setSelectedAppointmentId,
    handleStatusChange,
    handleSaveReviewDate,
    isRoleAllowed,
    fetchAppointments
  };
};
