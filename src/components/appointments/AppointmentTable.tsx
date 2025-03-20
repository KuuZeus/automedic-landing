
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentTableProps {
  appointments: any[];
  isLoading: boolean;
  canManageAppointments: boolean;
  handleStatusChange: (appointmentId: string, status: string) => void;
  navigate: (path: string) => void;
  statusFilter: string;
  dateRange: string;
}

const AppointmentTable = ({
  appointments,
  isLoading,
  canManageAppointments,
  handleStatusChange,
  navigate,
  statusFilter,
  dateRange,
}: AppointmentTableProps) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "attended":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "missed":
        return "bg-yellow-100 text-yellow-800";
      case "cancel":
        return "bg-red-100 text-red-800";
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
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No appointments found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {statusFilter !== "all" || dateRange !== "all"
            ? "Try changing your filters to see more appointments."
            : "Start by creating a new appointment."}
        </p>
        {canManageAppointments && (
          <div className="mt-6">
            <Button onClick={() => navigate("/new-appointment")}>
              <Plus className="h-4 w-4 mr-2" /> New Appointment
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">
                  {appointment.patient_name}
                </TableCell>
                <TableCell>{formatDate(appointment.date)}</TableCell>
                <TableCell>{formatTime(appointment.time)}</TableCell>
                <TableCell>{appointment.purpose || "Not specified"}</TableCell>
                <TableCell>{appointment.specialty || "-"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {canManageAppointments && appointment.status.toLowerCase() === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Select
                        onValueChange={(value) => handleStatusChange(appointment.id, value)}
                        defaultValue=""
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Attended">Attended</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AppointmentTable;
