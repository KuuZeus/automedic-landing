
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/lib/supabaseTypes";

export const useHospitalInfo = (userId: string | undefined) => {
  const [userHospital, setUserHospital] = useState<string | null>(null);
  const [userClinic, setUserClinic] = useState<string | null>(null);
  const [userHospitalId, setUserHospitalId] = useState<string | null>(null);
  const [userHospitalName, setUserHospitalName] = useState<string>("");
  const [userClinicName, setUserClinicName] = useState<string>("");

  const getUserHospitalInfo = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hospital, clinic')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserHospital(data.hospital);
        setUserClinic(data.clinic);
        
        // Find hospital ID based on hospital name
        if (data.hospital) {
          const { data: hospitalData, error: hospitalError } = await supabaseUntyped
            .from('hospitals')
            .select('id')
            .eq('name', data.hospital)
            .single();
            
          if (!hospitalError && hospitalData) {
            setUserHospitalId(hospitalData.id);
          }
        }
        
        setUserHospitalName(data.hospital || "");
        setUserClinicName(data.clinic || "");
      }
    } catch (error) {
      console.error('Error fetching user hospital info:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      getUserHospitalInfo();
    }
  }, [userId]);

  return {
    userHospital,
    userClinic,
    userHospitalId,
    userHospitalName,
    userClinicName
  };
};
