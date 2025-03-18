
import React, { useState, useEffect } from "react";
import { format, parseISO, isToday } from "date-fns";
import { CalendarIcon, CheckCircle2, Clock, User, Settings, Filter } from "lucide-react";
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
  DialogTrigger
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePatientStore, getPatientById, PatientAppointment } from "@/lib/patientDataService";

// Mock user data
const mockUserData = {
  id: "GH-DOC-10235",
  name: "Dr. Kwame Mensah",
  hospital: "Korle Bu Teaching Hospital",
  clinic: "Diabetes Clinic",
};

const appointmentFormSchema = z.object({
  patientName: z.string().min(3, { message: "Patient name is required" }),
  patientId: z.string().optional(),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  gender: z.enum(["male", "female"], {
    required_error: "Please select a gender",
  }),
  appointmentDate: z.date({
    required_error: "Appointment date is required",
  }),
  appointmentTime: z.string().min(1, { message: "Appointment time is required" }),
  clinic: z.string().min(1, { message: "Clinic is required" }),
  purpose: z.string().min(3, { message: "Purpose is required" }),
  notes: z.string().optional(),
});

const PatientSchedule = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Default to 2 weeks from now
  );
  const [isNextAppointmentDialogOpen, setIsNextAppointmentDialogOpen] = useState(false);
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  
  // Get appointments for the selected date
  const { appointments, updateAppointmentStatus, addAppointment } = usePatientStore();
  const [currentAppointments, setCurrentAppointments] = useState<PatientAppointment[]>([]);
  
  const user = mockUserData; // In a real app, this would come from auth context

  useEffect(() => {
    // Filter appointments for the selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filtered = appointments.filter(app => app.date === dateStr);
    setCurrentAppointments(filtered);
  }, [selectedDate, appointments]);

  const appointmentForm = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
      phoneNumber: "",
      gender: undefined,
      appointmentDate: new Date(),
      appointmentTime: "",
      clinic: user.clinic,
      purpose: "",
      notes: "",
    },
  });

  const updatePatientStatus = (appointmentId: string, newStatus: 'pending' | 'attended') => {
    updateAppointmentStatus(appointmentId, newStatus);
    
    toast.success(`Patient marked as ${newStatus}`);
  };

  const openNextAppointmentDialog = (patientId: string) => {
    setSelectedPatient(patientId);
    setIsNextAppointmentDialogOpen(true);
  };

  const scheduleNextAppointment = () => {
    if (!selectedPatient || !nextAppointmentDate) return;
    
    const patient = getPatientById(selectedPatient);
    if (!patient) return;
    
    // Create a new appointment
    addAppointment({
      patientId: selectedPatient,
      date: format(nextAppointmentDate, 'yyyy-MM-dd'),
      time: patient.time,
      purpose: "Follow-up",
      status: "pending",
    });
    
    toast.success(
      `Next appointment for patient ${selectedPatient} scheduled for ${format(
        nextAppointmentDate,
        "EEEE, MMMM do, yyyy"
      )}`
    );
    
    setIsNextAppointmentDialogOpen(false);
  };

  const handleCreateAppointment = (values: z.infer<typeof appointmentFormSchema>) => {
    // First check if we need to add a new patient or use existing
    let patientId = values.patientId;
    
    if (!patientId || patientId.trim() === "") {
      // This would normally create a new patient in the database
      patientId = `PAT-${Math.floor(Math.random() * 10000)}`;
    }
    
    // Create the appointment
    addAppointment({
      patientId: patientId,
      date: format(values.appointmentDate, 'yyyy-MM-dd'),
      time: values.appointmentTime,
      purpose: values.purpose,
      status: "pending",
      notes: values.notes,
    });
    
    toast.success("New appointment created successfully");
    appointmentForm.reset();
    setIsNewAppointmentDialogOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isToday(selectedDate) 
              ? "Today's Patient Schedule" 
              : `Patient Schedule: ${format(selectedDate, "EEEE, MMMM do, yyyy")}`}
          </h1>
          <p className="text-muted-foreground">
            {isToday(selectedDate) && format(selectedDate, "EEEE, MMMM do, yyyy")}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter by Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsDateFilterOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
                
          <Dialog open={isNewAppointmentDialogOpen} onOpenChange={setIsNewAppointmentDialogOpen}>
            <DialogTrigger asChild>
              <Button>New Appointment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <Form {...appointmentForm}>
                <form onSubmit={appointmentForm.handleSubmit(handleCreateAppointment)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={appointmentForm.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter patient name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient ID (if existing)</FormLabel>
                          <FormControl>
                            <Input placeholder="Patient ID (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-6"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="male" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Male
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="female" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Female
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="clinic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinic</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select clinic" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Diabetes Clinic">Diabetes Clinic</SelectItem>
                              <SelectItem value="Cardiology Clinic">Cardiology Clinic</SelectItem>
                              <SelectItem value="General OPD">General OPD</SelectItem>
                              <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                              <SelectItem value="Obstetrics & Gynecology">Obstetrics & Gynecology</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Appointment Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="appointmentTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                              <SelectItem value="9:30 AM">9:30 AM</SelectItem>
                              <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                              <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                              <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                              <SelectItem value="11:30 AM">11:30 AM</SelectItem>
                              <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                              <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                              <SelectItem value="2:30 PM">2:30 PM</SelectItem>
                              <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                              <SelectItem value="3:30 PM">3:30 PM</SelectItem>
                              <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={appointmentForm.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Appointment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New Consultation">New Consultation</SelectItem>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                            <SelectItem value="Medication Review">Medication Review</SelectItem>
                            <SelectItem value="Lab Results">Lab Results</SelectItem>
                            <SelectItem value="Procedure">Procedure</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appointmentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information or special requirements"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full md:w-auto">
                    Schedule Appointment
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => navigate("/user-profile")}>
            <User className="h-4 w-4 mr-2" />
            My Profile
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Patient Appointments</CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentAppointments.filter(p => p.status === "pending").length} pending
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAppointments.length > 0 ? (
                currentAppointments.map((appointment) => {
                  const patient = getPatientById(appointment.patientId);
                  if (!patient) return null;
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={patient.photoUrl} alt={patient.name} />
                            <AvatarFallback className={cn(
                              patient.gender === "male" ? "bg-blue-100" : "bg-pink-100",
                              patient.gender === "male" ? "text-blue-600" : "text-pink-600"
                            )}>
                              {getInitials(patient.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.gender}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.id}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{appointment.purpose}</TableCell>
                      <TableCell>
                        <Select
                          value={appointment.status}
                          onValueChange={(value: 'pending' | 'attended') => 
                            updatePatientStatus(appointment.id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>
                              {appointment.status === "pending" ? (
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No appointments scheduled for {format(selectedDate, "MMMM do, yyyy")}
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
