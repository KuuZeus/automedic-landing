
import React from "react";
import { Building, Home } from "lucide-react";

interface HospitalClinicInfoProps {
  userHospitalName: string;
  userClinicName: string;
}

const HospitalClinicInfo = ({ userHospitalName, userClinicName }: HospitalClinicInfoProps) => {
  if (!userHospitalName && !userClinicName) {
    return null;
  }
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center">
      {userHospitalName && (
        <div className="flex items-center mr-6">
          <Building className="h-5 w-5 text-health-600 mr-2" />
          <span className="font-medium">Hospital: {userHospitalName}</span>
        </div>
      )}
      {userClinicName && (
        <div className="flex items-center">
          <Home className="h-5 w-5 text-health-600 mr-2" />
          <span className="font-medium">Clinic: {userClinicName}</span>
        </div>
      )}
    </div>
  );
};

export default HospitalClinicInfo;
