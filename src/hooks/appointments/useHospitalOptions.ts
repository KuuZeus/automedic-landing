
import { useState, useEffect } from 'react';
import { supabaseUntyped } from "@/lib/supabaseTypes";

export const useHospitalOptions = (
  userRole: string | null, 
  userHospital: string | null,
  isRoleAllowed: (allowedRoles: string[]) => boolean
) => {
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);

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

  useEffect(() => {
    fetchHospitals();
  }, [userHospital]);

  return {
    selectedHospital,
    setSelectedHospital,
    hospitals,
    fetchHospitals
  };
};
