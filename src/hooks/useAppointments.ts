
import { useState, useEffect } from 'react';
import { useHospitalOptions } from './appointments/useHospitalOptions';
import { useFetchAppointments } from './appointments/useFetchAppointments';
import { useAppointmentStatus } from './appointments/useAppointmentStatus';
import { useOverdueAppointments } from './appointments/useOverdueAppointments';

export const useAppointments = (userRole: string | null, userHospital: string | null, userClinic: string | null) => {
  // Role-based access control helper
  const isRoleAllowed = (allowedRoles: string[]) => {
    return allowedRoles.includes(userRole || '');
  };

  // Get hospital options
  const {
    selectedHospital,
    setSelectedHospital,
    hospitals,
  } = useHospitalOptions(userRole, userHospital, isRoleAllowed);

  // Get appointments data
  const {
    appointments,
    setAppointments,
    isLoading,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    fetchAppointments: fetchAppointmentsBase
  } = useFetchAppointments(userRole, userHospital, userClinic);

  // Fetch appointments with the selected hospital
  const fetchAppointmentsWithHospital = async () => {
    await fetchAppointmentsBase(selectedHospital);
  };

  // Get appointment status management
  const {
    isReviewModalOpen,
    setIsReviewModalOpen,
    selectedAppointmentId,
    setSelectedAppointmentId,
    handleStatusChange,
    handleSaveReviewDate
  } = useAppointmentStatus(appointments, setAppointments, fetchAppointmentsWithHospital);

  // Handle overdue appointments
  const { updateOverdueAppointments } = useOverdueAppointments(appointments, setAppointments);

  // Fetch appointments when filters or selected hospital changes
  useEffect(() => {
    fetchAppointmentsWithHospital();
  }, [statusFilter, dateRange, selectedHospital, userHospital, userClinic]);

  // Check for overdue appointments when appointments data changes
  useEffect(() => {
    if (appointments.length > 0) {
      updateOverdueAppointments(appointments);
    }
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
    fetchAppointments: fetchAppointmentsWithHospital
  };
};
