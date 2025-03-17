
import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Mock data - would be fetched from API in a real app
const mockPatients = [
  { 
    id: "PAT-1001", 
    name: "Abena Owusu", 
    time: "9:00 AM", 
    purpose: "Follow-up",
    status: "pending" 
  },
  { 
    id: "PAT-1042", 
    name: "Kofi Mensah", 
    time: "10:30 AM", 
    purpose: "Medication Review",
    status: "attended" 
  },
  { 
    id: "PAT-1107", 
    name: "Ama Darko", 
    time: "11:45 AM", 
    purpose: "Lab Results",
    status: "pending" 
  },
  { 
    id: "PAT-1205", 
    name: "John Agyekum", 
    time: "2:00 PM", 
    purpose: "New Consultation",
    status: "pending" 
  },
  { 
    id: "PAT-1253", 
    name: "Fatima Ibrahim", 
    time: "3:15 PM", 
    purpose: "Follow-up",
    status: "pending" 
  },
];

const PatientSchedule = () => {
  const [patients, setPatients] = useState(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Default to 2 weeks from now
  );
  const [isNextAppointmentDialogOpen, setIsNextAppointmentDialogOpen] = useState(false);

  const updatePatientStatus = (patientId: string, newStatus: string) => {
    setPatients(
      patients.map((patient) =>
        patient.id === patientId ? { ...patient, status: newStatus } : patient
      )
    );
    
    toast.success(`Patient ${patientId} marked as ${newStatus}`);
  };

  const openNextAppointmentDialog = (patientId: string) => {
    setSelectedPatient(patientId);
    setIsNextAppointmentDialogOpen(true);
  };

  const scheduleNextAppointment = () => {
    if (!selectedPatient || !nextAppointmentDate) return;
    
    toast.success(
      `Next appointment for patient ${selectedPatient} scheduled for ${format(
        nextAppointmentDate,
        "EEEE, MMMM do, yyyy"
      )}`
    );
    
    setIsNextAppointmentDialogOpen(false);
  };

  return (
    <div className="container max-w-7xl mx-auto py-24 px-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Today's Patient Schedule</CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM do, yyyy")}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.id}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.time}</TableCell>
                    <TableCell>{patient.purpose}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={patient.status}
                        onValueChange={(value) => updatePatientStatus(patient.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue>
                            {patient.status === "pending" ? (
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Pending
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Attended
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              Pending
                            </span>
                          </SelectItem>
                          <SelectItem value="attended">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Attended
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNextAppointmentDialog(patient.id)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Next Appointment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No appointments scheduled for today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Next Appointment Dialog */}
      <Dialog open={isNextAppointmentDialogOpen} onOpenChange={setIsNextAppointmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Next Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Patient ID</h4>
              <p className="text-sm text-muted-foreground">{selectedPatient}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Next Appointment Date</h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !nextAppointmentDate && "text-muted-foreground"
                    )}
                  >
                    {nextAppointmentDate ? (
                      format(nextAppointmentDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextAppointmentDate}
                    onSelect={setNextAppointmentDate}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={scheduleNextAppointment}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientSchedule;
