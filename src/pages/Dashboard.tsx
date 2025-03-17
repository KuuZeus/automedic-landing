
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Users, ClipboardList } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Temporary mock data - would be fetched from API/database in a real app
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
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  
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
    setIsAppointmentDialogOpen(false);
  };

  return (
    <div className="container max-w-7xl mx-auto py-24 px-4">
      {/* User Profile Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card>
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

        {/* Dashboard Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
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
            
            <Link to="/patient-schedule">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Today's Patient Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Hello, {user.name}!</p>
              <p className="text-sm text-muted-foreground">
                Today is {format(new Date(), "EEEE, MMMM do, yyyy")}
              </p>
              <p className="text-sm">
                Use the dashboard to manage your appointments and patient schedule.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Quick Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Today's Appointments</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Completed</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Pending</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">This Week</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
              </div>
              <div className="pt-4">
                <Link to="/patient-schedule">
                  <Button variant="outline" size="sm" className="w-full">
                    View Full Schedule
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-sm font-medium">Kofi Mensah marked as attended</p>
                <p className="text-xs text-muted-foreground">Today at 10:45 AM</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm font-medium">New appointment created for Ama Darko</p>
                <p className="text-xs text-muted-foreground">Today at 9:30 AM</p>
              </div>
              <div className="border-l-4 border-amber-500 pl-4 py-2">
                <p className="text-sm font-medium">Follow-up scheduled for John Agyekum</p>
                <p className="text-xs text-muted-foreground">Yesterday at 4:15 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
