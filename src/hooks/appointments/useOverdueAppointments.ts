
import { format, isPast, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { createAuditLog } from "@/lib/auditLogService";
import { useEffect } from "react";

export const useOverdueAppointments = (
  appointments: any[],
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>
) => {
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
    updateOverdueAppointments
  };
};
