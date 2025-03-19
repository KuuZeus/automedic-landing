import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { PatientAppointment } from "@/lib/patientDataService";
import { Calendar, Clock, User, FileText, CheckCircle2, XCircle, Filter, Hospital, Building, CalendarPlus } from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReviewDateModal from "@/components/ReviewDateModal";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DbAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  time: string;
  purpose: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  next_review_date?: string;
  hospital?: string;
  clinic?: string;
}

interface ProfileData {
  hospital: string | null;
  clinic: string | null;
}

const appointmentFormSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name is required" }),
  patientId: z.string().min(2, { message: "Patient ID is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }),
  notes: z.string().optional(),
  appointmentType: z.enum(["internal", "external"]),
  hospital: z.string().min(1, { message: "Hospital is required" }),
  clinic: z.string().optional(),
});

const PatientSchedule = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({ hospital: null, clinic: null });
  const [purposeFilter, setPurposeFilter] = useState<string>("");
  const [uniquePurposes, setUniquePurposes] = useState<string[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string>("");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('hospital, clinic')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile({
        hospital: data.hospital,
        clinic: data.clinic
      });
    };
    
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (selectedDate && profile.hospital && profile.clinic) {
      fetchAppointments(selectedDate);
    } else if (selectedDate && user) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate, profile, user]);

  const fetchAppointments = async (date: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate);
      
      if (profile.hospital) {
        query = query.eq('hospital', profile.hospital);
      }
      
      if (profile.clinic) {
        query = query.eq('clinic', profile.clinic);
      }
      
      query = query.order('time');
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      if (data) {
        const purposes = [...new Set(data.map((appointment: DbAppointment) => appointment.purpose))];
        setUniquePurposes(purposes);
      }

      if (data) {
        const formattedAppointments: PatientAppointment[] = data.map((appointment: DbAppointment) => ({
          id: appointment.id,
          patientId: appointment.patient_id,
          date: appointment.date,
          time: appointment.time,
          purpose: appointment.purpose,
          status: appointment.status === 'attended' ? 'attended' : 'pending',
          notes: appointment.notes,
          patientName: appointment.patient_name,
          nextReviewDate: appointment.next_review_date,
          hospital: appointment.hospital,
          clinic: appointment.clinic
        }));

        let filteredAppointments = formattedAppointments;
        if (purposeFilter) {
          filteredAppointments = formattedAppointments.filter(
            (appointment) => appointment.purpose === purposeFilter
          );
        }

        const sortedAppointments = filteredAppointments.sort((a, b) => {
          if (a.status === 'pending' && b.status === 'attended') return -1;
          if (a.status === 'attended' && b.status === 'pending') return 1;
          
          const timeA = convertTimeToMinutes(a.time);
          const timeB = convertTimeToMinutes(b.time);
          return timeA - timeB;
        });

        setAppointments(sortedAppointments);
      }
    } catch (error: any) {
      toast.error(`Error fetching appointments: ${error.message}`);
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAppointment = async (data: z.infer<typeof appointmentFormSchema>) => {
    try {
      if (!user) {
        toast.error("You must be logged in to create an appointment");
        return;
      }

      let hospitalValue = data.hospital;
      let clinicValue = data.clinic;

      if (data.appointmentType === "internal") {
        hospitalValue = profile.hospital || data.hospital;
      }

      const appointmentData = {
        patient_id: data.patientId,
        patient_name: data.patientName,
        date: data.date,
        time: data.time,
        purpose: data.purpose,
        notes: data.notes || null,
        status: 'pending',
        hospital: hospitalValue,
        clinic: clinicValue
      };

      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      toast.success("Appointment created successfully");
      setIsNewAppointmentOpen(false);
      fetchAppointments(selectedDate);
    } catch (error: any) {
      toast.error(`Error creating appointment: ${error.message}`);
      console.error('Error creating appointment:', error);
    }
  };

  const handleStatusToggle = (id: string, currentStatus: 'pending' | 'attended') => {
    if (currentStatus === 'pending') {
      setCurrentAppointmentId(id);
      setIsReviewModalOpen(true);
    } else {
      updateAppointmentStatus(id, 'pending');
    }
  };

  const handleSaveReviewDate = async (reviewDate: string) => {
    await updateAppointmentStatus(currentAppointmentId, 'attended', reviewDate);
  };

  const updateAppointmentStatus = async (
    id: string, 
    newStatus: 'pending' | 'attended',
    nextReviewDate?: string
  ) => {
    try {
      const updateData: { status: string; next_review_date?: string } = { 
        status: newStatus
      };
      
      if (nextReviewDate) {
        updateData.next_review_date = nextReviewDate;
      }
      
      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === id ? { 
          ...appointment, 
          status: newStatus, 
          ...(nextReviewDate && { nextReviewDate })
        } : appointment
      );
      setAppointments(updatedAppointments);
      
      toast.success(`Appointment marked as ${newStatus}${nextReviewDate ? ` with next review on ${nextReviewDate}` : ''}`);
    } catch (error: any) {
      toast.error(`Error updating status: ${error.message}`);
      console.error('Error updating appointment status:', error);
    }
  };

  const convertTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  const handleFilterChange = (purpose: string) => {
    setPurposeFilter(purpose === purposeFilter ? "" : purpose);
    fetchAppointments(selectedDate);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Schedule</h1>
              
              {profile.hospital && (
                <div className="flex items-center gap-1 text-gray-600 mt-1">
                  <Hospital className="h-4 w-4" />
                  <span className="font-medium">{profile.hospital}</span>
                  {profile.clinic && (
                    <>
                      <span className="mx-1">-</span>
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{profile.clinic}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
              <DialogTrigger asChild>
                <Button className="bg-health-600 hover:bg-health-700 flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  <span>Make New Appointment</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Appointment</DialogTitle>
                  <DialogDescription>
                    Fill in the details to schedule a new patient appointment.
                  </DialogDescription>
                </DialogHeader>
                <NewAppointmentForm
                  onSubmit={addAppointment}
                  selectedDate={selectedDate}
                  currentHospital={profile.hospital}
                  currentClinic={profile.clinic}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-health-600" />
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-health-500"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {purposeFilter ? `Filtered: ${purposeFilter}` : "Filter by Purpose"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <h3 className="font-medium">Filter by Purpose</h3>
                  <div className="flex flex-col gap-1">
                    {uniquePurposes.map((purpose) => (
                      <Button
                        key={purpose}
                        variant={purposeFilter === purpose ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => handleFilterChange(purpose)}
                      >
                        {purpose}
                      </Button>
                    ))}
                    {purposeFilter && (
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setPurposeFilter("")}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Pending: {appointments.filter(a => a.status === 'pending').length}</span>
                </span>
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Attended: {appointments.filter(a => a.status === 'attended').length}</span>
                </span>
              </Badge>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-health-600"></div>
            </div>
          ) : (
            <>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="attended">Attended</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <AppointmentsTable 
                    appointments={appointments}
                    handleStatusToggle={handleStatusToggle}
                  />
                </TabsContent>
                
                <TabsContent value="pending">
                  <AppointmentsTable 
                    appointments={appointments.filter(a => a.status === 'pending')}
                    handleStatusToggle={handleStatusToggle}
                  />
                </TabsContent>
                
                <TabsContent value="attended">
                  <AppointmentsTable 
                    appointments={appointments.filter(a => a.status === 'attended')}
                    handleStatusToggle={handleStatusToggle}
                  />
                </TabsContent>
              </Tabs>
              
              {appointments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">No appointments scheduled for this date</p>
                  <p className="text-sm">Select a different date or add an appointment</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <ReviewDateModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSave={handleSaveReviewDate}
        appointmentId={currentAppointmentId}
      />
      
      <Footer />
    </div>
  );
};

// Dummy data for dropdowns
const DUMMY_HOSPITALS = [
  "Korle Bu Teaching Hospital",
  "37 Military Hospital",
  "Ridge Hospital",
  "Tema General Hospital",
  "University of Ghana Medical Centre",
  "Greater Accra Regional Hospital",
];

const DUMMY_CLINICS = [
  "Hypertension Clinic",
  "Diabetes Clinic",
  "Antenatal Clinic",
  "Postnatal Clinic",
  "HIV Clinic",
  "Renal Clinic",
  "Heart Failure Clinic",
  "TB Clinic",
  "Outpatient Clinic",
  "Pediatric Clinic",
];

const DUMMY_PURPOSES = [
  "Initial Consultation",
  "Follow-up",
  "Medication Review",
  "Lab Results",
  "Surgery Consultation",
  "Vaccination",
  "Health Screening",
  "Wellness Check",
  "Specialist Referral",
  "Emergency",
];

const NewAppointmentForm = ({ 
  onSubmit,
  selectedDate,
  currentHospital,
  currentClinic
}: { 
  onSubmit: (data: z.infer<typeof appointmentFormSchema>) => void,
  selectedDate: Date,
  currentHospital: string | null,
  currentClinic: string | null
}) => {
  const [appointmentType, setAppointmentType] = useState<string>("internal");

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: "",
      purpose: "",
      notes: "",
      appointmentType: "internal",
      hospital: currentHospital || "",
      clinic: currentClinic || ""
    }
  });

  const watchAppointmentType = form.watch("appointmentType");

  useEffect(() => {
    if (watchAppointmentType === "internal") {
      form.setValue("hospital", currentHospital || "");
    } else if (watchAppointmentType === "external" && form.getValues("hospital") === currentHospital) {
      form.setValue("hospital", "");
    }
  }, [watchAppointmentType, currentHospital, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="appointmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setAppointmentType(value);
                  }}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (Same Hospital)</SelectItem>
                    <SelectItem value="external">External (Different Hospital)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
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
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter patient ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {watchAppointmentType === "external" && (
          <FormField
            control={form.control}
            name="hospital"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hospital</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {DUMMY_HOSPITALS.map((hospital) => (
                        <SelectItem key={hospital} value={hospital}>
                          {hospital}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="clinic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinic</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {DUMMY_CLINICS.map((clinic) => (
                      <SelectItem key={clinic} value={clinic}>
                        {clinic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} 
                    onChange={(e) => {
                      const timeValue = e.target.value;
                      if (timeValue) {
                        const [hours, minutes] = timeValue.split(':');
                        const hour = parseInt(hours, 10);
                        const period = hour >= 12 ? 'PM' : 'AM';
                        const formattedHour = hour % 12 || 12;
                        field.onChange(`${formattedHour}:${minutes} ${period}`);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {DUMMY_PURPOSES.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" className="bg-health-600 hover:bg-health-700">
            Schedule Appointment
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const AppointmentsTable = ({ 
  appointments, 
  handleStatusToggle 
}: { 
  appointments: PatientAppointment[],
  handleStatusToggle: (id: string, status: 'pending' | 'attended') => void
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Hospital/Clinic</TableHead>
            <TableHead>Next Review</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`${appointment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}
                >
                  {appointment.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{appointment.patientName}</TableCell>
              <TableCell>{appointment.time}</TableCell>
              <TableCell>{appointment.purpose}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{appointment.hospital}</span>
                  {appointment.clinic && (
                    <span className="text-xs text-gray-500">{appointment.clinic}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{appointment.nextReviewDate || '-'}</TableCell>
              <TableCell>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => handleStatusToggle(appointment.id, appointment.status)}
                >
                  {appointment.status === 'pending' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Attended</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Mark Pending</span>
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientSchedule;
