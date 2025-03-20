
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createAuditLog } from "@/lib/auditLogService";
import { useState } from "react";

export const useAppointmentStatus = (
  appointments: any[],
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>,
  fetchAppointments: () => Promise<void>
) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

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

  return {
    isReviewModalOpen,
    setIsReviewModalOpen,
    selectedAppointmentId,
    setSelectedAppointmentId,
    handleStatusChange,
    handleSaveReviewDate,
    markAppointmentStatus
  };
};
