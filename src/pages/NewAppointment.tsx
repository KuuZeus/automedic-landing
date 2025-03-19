
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as CalendarIcon, Hospital, Building, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

// Mock Calendly URLs mapping for demo purposes
const CALENDLY_URLS = {
  "Korle Bu Teaching Hospital": {
    "Hypertension Clinic": "https://calendly.com/korleBu-hypertension",
    "Diabetes Clinic": "https://calendly.com/korleBu-diabetes",
    // Add more clinic-specific URLs
  },
  "37 Military Hospital": {
    "Hypertension Clinic": "https://calendly.com/military37-hypertension",
    "Diabetes Clinic": "https://calendly.com/military37-diabetes",
    // Add more clinic-specific URLs
  },
  // Add more hospital mappings
};

// Form schema
const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(2, { message: "Last name is required" }),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }),
  notes: z.string().optional(),
  hospital: z.string().min(1, { message: "Hospital is required" }),
  clinic: z.string().min(1, { message: "Clinic is required" }),
  gender: z.string().min(1, { message: "Gender is required" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, { message: "Address is required" }),
  occupation: z.string().optional(),
  hasInsurance: z.boolean().default(false),
  insuranceNumber: z.string().optional(),
  diagnosis: z.string().min(1, { message: "Diagnosis is required" }),
});

type FormValues = z.infer<typeof formSchema>;

// Steps for the appointment creation process
type AppointmentStep = 'selection' | 'scheduling' | 'form';

const NewAppointment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ hospital: null, clinic: null });
  const [submitting, setSubmitting] = useState(false);
  const [calendlyURL, setCalendlyURL] = useState<string | null>(null);
  const [appointmentStep, setAppointmentStep] = useState<AppointmentStep>('selection');
  const [selectedDateTime, setSelectedDateTime] = useState<{ date: Date | null, time: string | null }>({
    date: null,
    time: null
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      date: new Date(),
      time: "",
      purpose: "",
      notes: "",
      hospital: "",
      clinic: "",
      gender: "",
      phoneNumber: "",
      email: "",
      address: "",
      occupation: "",
      hasInsurance: false,
      insuranceNumber: "",
      diagnosis: "",
    },
  });

  // Fetch user profile information
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
      
      if (data.hospital) {
        form.setValue('hospital', data.hospital);
      }
      
      if (data.clinic) {
        form.setValue('clinic', data.clinic);
      }
    };
    
    fetchUserProfile();
  }, [user, form]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  // Watch for hospital and clinic selection changes
  const selectedHospital = form.watch("hospital");
  const selectedClinic = form.watch("clinic");

  // Update calendly URL when hospital and clinic are selected
  useEffect(() => {
    if (selectedHospital && selectedClinic) {
      // In a real app, you would fetch this from your database
      const hospitalCalendars = CALENDLY_URLS[selectedHospital as keyof typeof CALENDLY_URLS];
      if (hospitalCalendars) {
        const clinicCalendar = hospitalCalendars[selectedClinic as keyof typeof hospitalCalendars];
        if (clinicCalendar) {
          setCalendlyURL(clinicCalendar);
        } else {
          setCalendlyURL(null);
          console.warn(`No Calendly URL found for ${selectedClinic} at ${selectedHospital}`);
        }
      } else {
        setCalendlyURL(null);
        console.warn(`No Calendly settings found for ${selectedHospital}`);
      }
    }
  }, [selectedHospital, selectedClinic]);

  // Proceed to next step after hospital/clinic selection
  const handleSelectionComplete = () => {
    const hospital = form.getValues('hospital');
    const clinic = form.getValues('clinic');
    
    if (!hospital || !clinic) {
      toast.error("Please select both hospital and clinic");
      return;
    }
    
    setAppointmentStep('scheduling');
  };

  // This function would be called when Calendly booking is complete
  // In a real implementation, you would get this from the Calendly API callback
  const handleCalendlyBookingComplete = (event: any) => {
    // Normally you would extract this from the Calendly event
    const mockDate = new Date();
    const mockTime = "14:30";
    
    setSelectedDateTime({
      date: mockDate,
      time: mockTime
    });
    
    // Set form values
    form.setValue('date', mockDate);
    form.setValue('time', mockTime);
    
    // Move to patient form
    setAppointmentStep('form');
  };

  // For demo purposes, we're simulating a Calendly integration
  const simulateCalendlySelection = () => {
    const mockDate = new Date();
    const mockTime = "14:30";
    
    setSelectedDateTime({
      date: mockDate,
      time: mockTime
    });
    
    // Set form values
    form.setValue('date', mockDate);
    form.setValue('time', mockTime);
    
    // Move to patient form
    setAppointmentStep('form');
    
    toast.success("Appointment time selected");
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      const formattedTime = values.time ? format(new Date(`2000-01-01T${values.time}`), 'h:mm a') : "";
      const formattedDate = format(values.date, 'yyyy-MM-dd');
      
      // Construct full patient name
      const patientName = values.middleName 
        ? `${values.firstName} ${values.middleName} ${values.lastName}`
        : `${values.firstName} ${values.lastName}`;

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: Math.random().toString(36).substring(2, 12), // This would normally be a real patient ID
          patient_name: patientName,
          date: formattedDate,
          time: formattedTime,
          purpose: values.purpose,
          status: 'pending',
          notes: values.notes,
          hospital: values.hospital,
          clinic: values.clinic,
          gender: values.gender,
          phone_number: values.phoneNumber,
          email: values.email || null,
          address: values.address,
          occupation: values.occupation || null,
          has_insurance: values.hasInsurance,
          insurance_number: values.hasInsurance ? values.insuranceNumber : null,
          diagnosis: values.diagnosis,
        });

      if (error) {
        throw error;
      }

      toast.success("Appointment created successfully");
      navigate("/patient-schedule");
    } catch (error: any) {
      toast.error(`Error creating appointment: ${error.message}`);
      console.error('Error creating appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }
  
  if (!user) return null;

  const renderStepContent = () => {
    switch (appointmentStep) {
      case 'selection':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Select Hospital and Clinic</h2>
              <p className="text-gray-600">Please select the hospital and clinic you want to book an appointment with.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hospital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hospital" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DUMMY_HOSPITALS.map((hospital) => (
                            <SelectItem key={hospital} value={hospital}>
                              {hospital}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clinic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedHospital}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedHospital ? "Select clinic" : "Select hospital first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DUMMY_CLINICS.map((clinic) => (
                            <SelectItem key={clinic} value={clinic}>
                              {clinic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-health-600 hover:bg-health-700"
                onClick={handleSelectionComplete}
                disabled={!selectedHospital || !selectedClinic}
              >
                Continue to Schedule
              </Button>
            </div>
          </div>
        );
        
      case 'scheduling':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Schedule Your Appointment</h2>
              <p className="text-gray-600">
                Please select an available time slot for your appointment at {selectedHospital} - {selectedClinic}.
              </p>
              
              {/* Mock Calendly Interface */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-4">Available Appointment Slots</h3>
                  
                  {/* This would be replaced with actual Calendly embed in production */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                    {['9:00 AM', '10:30 AM', '11:45 AM', '1:15 PM', '2:30 PM', '4:00 PM'].map((time) => (
                      <Button 
                        key={time} 
                        variant="outline" 
                        className="justify-center"
                        onClick={simulateCalendlySelection}
                      >
                        Today at {time}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-2">
                      Note: In a real implementation, this would be replaced with the Calendly scheduling widget
                      specific to the selected hospital and clinic.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setAppointmentStep('selection')}
                    >
                      Go Back to Selection
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'form':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointment Confirmation */}
                <div className="space-y-4 md:col-span-2">
                  <h2 className="text-lg font-semibold border-b pb-2">Appointment Details</h2>
                  <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Your appointment is scheduled for:</p>
                      <p className="text-gray-700">
                        {selectedDateTime.date ? format(selectedDateTime.date, 'EEEE, MMMM d, yyyy') : ''} at {selectedDateTime.time}
                      </p>
                      <p className="text-gray-700">
                        {selectedHospital} - {selectedClinic}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Patient Basic Information */}
                <div className="space-y-4 md:col-span-2">
                  <h2 className="text-lg font-semibold border-b pb-2">Patient Information</h2>
                  
                  {/* Name fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter middle name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter occupation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Moved diagnosis field to patient information section */}
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter diagnosis or condition" 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="hasInsurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Has National Health Insurance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("hasInsurance") && (
                      <FormField
                        control={form.control}
                        name="insuranceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter insurance number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
                
                {/* Purpose and Notes */}
                <div className="space-y-4 md:col-span-2">
                  <h2 className="text-lg font-semibold border-b pb-2">Additional Information</h2>
                  
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DUMMY_PURPOSES.map((purpose) => (
                              <SelectItem key={purpose} value={purpose}>
                                {purpose}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter additional notes" 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAppointmentStep('scheduling')}
                >
                  Back to Scheduling
                </Button>
                <Button
                  type="submit"
                  className="bg-health-600 hover:bg-health-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Appointment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
            
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
          
          {/* Progress steps indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  appointmentStep === 'selection' ? 'bg-health-600 text-white' : 'bg-health-100 text-health-600'
                }`}>
                  1
                </div>
                <span className="text-sm mt-1">Select Location</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-gray-200">
                <div className={`h-full ${appointmentStep !== 'selection' ? 'bg-health-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  appointmentStep === 'scheduling' ? 'bg-health-600 text-white' : 
                  appointmentStep === 'form' ? 'bg-health-100 text-health-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className="text-sm mt-1">Schedule</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-gray-200">
                <div className={`h-full ${appointmentStep === 'form' ? 'bg-health-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  appointmentStep === 'form' ? 'bg-health-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <span className="text-sm mt-1">Patient Details</span>
              </div>
            </div>
          </div>
          
          {renderStepContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewAppointment;
