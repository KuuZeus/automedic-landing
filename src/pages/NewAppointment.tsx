
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Hospital, Building } from "lucide-react";

const appointmentFormSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name is required" }),
  patientId: z.string().min(2, { message: "Patient ID is required" }),
  gender: z.enum(["male", "female", "other"]),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1, { message: "Address is required" }),
  occupation: z.string().min(1, { message: "Occupation is required" }),
  hasInsurance: z.enum(["yes", "no"]),
  insuranceNumber: z.string().optional().or(z.literal('')),
  diagnosis: z.string().min(1, { message: "Diagnosis is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }),
  notes: z.string().optional(),
  appointmentType: z.enum(["internal", "external"]),
  hospital: z.string().min(1, { message: "Hospital is required" }),
  clinic: z.string().optional(),
});

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

const DUMMY_DIAGNOSES = [
  "Hypertension",
  "Type 2 Diabetes",
  "Malaria",
  "Typhoid Fever",
  "Asthma",
  "Pneumonia",
  "Tuberculosis",
  "HIV/AIDS",
  "Sickle Cell Disease",
  "Gastroenteritis",
  "Urinary Tract Infection",
  "Arthritis",
  "Bronchitis",
  "Anemia",
  "To be determined",
];

const NewAppointment = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ hospital: null, clinic: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
      gender: "male",
      phoneNumber: "",
      email: "",
      address: "",
      occupation: "",
      hasInsurance: "no",
      insuranceNumber: "",
      diagnosis: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      time: "",
      purpose: "",
      notes: "",
      appointmentType: "internal",
      hospital: "",
      clinic: ""
    }
  });

  const watchAppointmentType = form.watch("appointmentType");
  const watchHasInsurance = form.watch("hasInsurance");

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
        form.setValue("hospital", data.hospital);
      }
      
      if (data.clinic) {
        form.setValue("clinic", data.clinic);
      }
    };
    
    fetchUserProfile();
  }, [user, form]);

  useEffect(() => {
    if (watchAppointmentType === "internal") {
      form.setValue("hospital", profile.hospital || "");
    }
  }, [watchAppointmentType, profile.hospital, form]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: z.infer<typeof appointmentFormSchema>) => {
    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error("You must be logged in to create an appointment");
        return;
      }

      let hospitalValue = data.hospital;

      if (data.appointmentType === "internal") {
        hospitalValue = profile.hospital || data.hospital;
      }

      const appointmentData = {
        patient_id: data.patientId,
        patient_name: data.patientName,
        gender: data.gender,
        phone_number: data.phoneNumber,
        email: data.email || null,
        address: data.address,
        occupation: data.occupation,
        has_insurance: data.hasInsurance === "yes",
        insurance_number: data.insuranceNumber || null,
        diagnosis: data.diagnosis,
        date: data.date,
        time: data.time,
        purpose: data.purpose,
        notes: data.notes || null,
        status: 'pending',
        hospital: hospitalValue,
        clinic: data.clinic || null
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
      navigate("/patient-schedule");
    } catch (error: any) {
      toast.error(`Error creating appointment: ${error.message}`);
      console.error('Error creating appointment:', error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Make New Appointment</h1>
            
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

            <div className="flex items-center gap-2 mt-2">
              <Calendar className="h-5 w-5 text-health-600" />
              <span className="text-gray-600">{format(new Date(), 'PPP')}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-semibold mb-4">Appointment Type</h2>
                <FormField
                  control={form.control}
                  name="appointmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
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
              </div>

              <div className="bg-gray-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
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

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter residential address" {...field} />
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
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter occupation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasInsurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Has National Health Insurance?</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchHasInsurance === "yes" && (
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

              <div className="bg-gray-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-semibold mb-4">Medical Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select diagnosis" />
                            </SelectTrigger>
                            <SelectContent>
                              {DUMMY_DIAGNOSES.map((diagnosis) => (
                                <SelectItem key={diagnosis} value={diagnosis}>
                                  {diagnosis}
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
                      <FormItem className="col-span-2">
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/patient-schedule")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-health-600 hover:bg-health-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewAppointment;
