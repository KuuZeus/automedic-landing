
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HospitalOption } from "@/types/hospital";

interface AppointmentFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  selectedHospital: string | null;
  setSelectedHospital: (value: string | null) => void;
  hospitals: HospitalOption[];
  isRoleAllowed: (allowedRoles: string[]) => boolean;
}

const AppointmentFilters = ({
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  selectedHospital,
  setSelectedHospital,
  hospitals,
  isRoleAllowed,
}: AppointmentFiltersProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger id="date-filter" className="w-full">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="all">All Dates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isRoleAllowed(['super_admin']) && (
          <div className="flex-1">
            <label htmlFor="hospital-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Hospital
            </label>
            <Select value={selectedHospital || ""} onValueChange={setSelectedHospital}>
              <SelectTrigger id="hospital-filter" className="w-full">
                <SelectValue placeholder="All Hospitals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Hospitals</SelectItem>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentFilters;
