
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthNav from "@/components/AuthNav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import ReviewDateModal from "@/components/ReviewDateModal";
import AppointmentFilters from "@/components/appointments/AppointmentFilters";
import AppointmentTable from "@/components/appointments/AppointmentTable";
import HospitalClinicInfo from "@/components/appointments/HospitalClinicInfo";
import { useAppointments } from "@/hooks/useAppointments";
import { useHospitalInfo } from "@/hooks/useHospitalInfo";

const PatientSchedule = () => {
  const { user, loading, userRole, canManageAppointments } = useAuth();
  const navigate = useNavigate();
  
  // Get hospital and clinic info
  const { 
    userHospital, 
    userClinic, 
    userHospitalId,
    userHospitalName, 
    userClinicName 
  } = useHospitalInfo(user?.id);
  
  // Get appointments and related functions
  const {
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
  } = useAppointments(userRole, userHospital, userClinic);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/sign-in");
      } else if (userRole === 'analytics_viewer') {
        navigate("/dashboard");
        toast.error("You don't have permission to access the appointments page");
      }
    }
  }, [user, loading, userRole, navigate]);

  // Get the actual boolean value instead of the function
  const canManageAppointmentsValue = canManageAppointments ? canManageAppointments() : false;

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNav />
      <div className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Patient Appointments</h1>
          {canManageAppointmentsValue && (
            <Button onClick={() => navigate("/new-appointment")}>
              <Plus className="h-4 w-4 mr-2" /> New Appointment
            </Button>
          )}
        </div>
        
        {/* Hospital and Clinic Info */}
        <HospitalClinicInfo 
          userHospitalName={userHospitalName} 
          userClinicName={userClinicName} 
        />

        {/* Filters */}
        <AppointmentFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedHospital={selectedHospital}
          setSelectedHospital={setSelectedHospital}
          hospitals={hospitals}
          isRoleAllowed={isRoleAllowed}
        />

        {/* Appointments Table */}
        <AppointmentTable
          appointments={appointments}
          isLoading={isLoading}
          canManageAppointments={canManageAppointmentsValue}
          handleStatusChange={handleStatusChange}
          navigate={navigate}
          statusFilter={statusFilter}
          dateRange={dateRange}
        />
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
    </div>
  );
};

export default PatientSchedule;
