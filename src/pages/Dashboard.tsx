
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Temporary mock data - would be fetched from API/database in a real app
const mockUserData = {
  id: "GH-DOC-10235",
  name: "Dr. Kwame Mensah",
  hospital: "Korle Bu Teaching Hospital",
  clinic: "Diabetes Clinic",
};

const mockPatients = [
  { id: "PAT-1001", name: "Abena Owusu", time: "9:00 AM", purpose: "Follow-up" },
  { id: "PAT-1042", name: "Kofi Mensah", time: "10:30 AM", purpose: "Medication Review" },
  { id: "PAT-1107", name: "Ama Darko", time: "11:45 AM", purpose: "Lab Results" },
  { id: "PAT-1205", name: "John Agyekum", time: "2:00 PM", purpose: "New Consultation" },
  { id: "PAT-1253", name: "Fatima Ibrahim", time: "3:15 PM", purpose: "Follow-up" },
];

const appointmentFormSchema = z.object({
  patientName: z.string().min(3, { message: "Patient name is required" }),
  patientId: z.string().optional(),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  appointmentDate: z.date({
    required_error: "Appointment date is required",
  }),
  appointmentTime: z.string().min(1, { message: "Appointment time is required" }),
  clinic: z.string().min(1, { message: "Clinic is required" }),
  purpose: z.string().min(3, { message: "Purpose is required" }),
  notes: z.string().optional(),
});

const Dashboard = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Check if user is logged in (in a real app, this would use auth context)
  // For now, let's assume the user is logged in with mock data
  const user = mockUserData;
  
  const appointmentForm = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
      phoneNumber: "",
      appointmentDate: new Date(),
      appointmentTime: "",
      clinic: user.clinic,
      purpose: "",
      notes: "",
    },
  });

  const handleCreateAppointment = (values: z.infer<typeof appointmentFormSchema>) => {
    // Here you would send the appointment data to your backend
    console.log("Creating appointment:", values);
    
    toast.success("Appointment created successfully");
    appointmentForm.reset();
  };

  // In a real app, you would fetch today's appointments from your API
  const todaysPatients = mockPatients;

  return (
    <div className="container max-w-7xl mx-auto py-24 px-4">
      {/* User Profile Overview */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-10">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle className="text-xl">Provider Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hospital</p>
              <p className="font-medium">{user.hospital}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clinic</p>
              <p className="font-medium">{user.clinic}</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="w-full md:w-2/3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Today's Patient Reviews</CardTitle>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysPatients.length > 0 ? (
                  todaysPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.id}</TableCell>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.time}</TableCell>
                      <TableCell>{patient.purpose}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No appointments scheduled for today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Appointment Section */}
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="text-xl">Schedule New Appointment</CardTitle>
        </CardHeader>
        <CardContent>
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

              <Button type="submit" className="w-full md:w-auto bg-health-600 hover:bg-health-700">
                Schedule Appointment
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
