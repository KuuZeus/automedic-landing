
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export const useFetchAppointments = (
  userRole: string | null,
  userHospital: string | null,
  userClinic: string | null
) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("upcoming");

  const fetchAppointments = async (
    selectedHospital: string | null
  ) => {
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
      } else if (userHospital && userRole !== 'super_admin') {
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
        
        // Convert status to consistent format
        const updatedData = data.map(appointment => {
          const status = appointment.status.toLowerCase();
          if (status === "scheduled") return { ...appointment, status: "pending" };
          if (status === "completed") return { ...appointment, status: "attended" };
          if (status === "no-show") return { ...appointment, status: "missed" };
          if (status === "cancelled") return { ...appointment, status: "cancelled" };
          return appointment;
        });
        
        setAppointments(updatedData);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointments,
    setAppointments,
    isLoading,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    fetchAppointments
  };
};
