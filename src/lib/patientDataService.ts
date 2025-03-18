
import { create } from 'zustand';
import { format } from 'date-fns';

export interface Patient {
  id: string;
  name: string;
  time: string;
  purpose: string;
  status: 'pending' | 'attended';
  gender: 'male' | 'female';
  photoUrl: string;
}

export interface PatientAppointment {
  id: string;
  patientId: string;
  date: string; // ISO date string
  time: string;
  purpose: string;
  status: 'pending' | 'attended';
  notes?: string;
}

interface PatientStore {
  patients: Patient[];
  appointments: PatientAppointment[];
  getPatientsByDate: (date: Date) => PatientAppointment[];
  updateAppointmentStatus: (appointmentId: string, status: 'pending' | 'attended') => void;
  addAppointment: (appointment: Omit<PatientAppointment, 'id'>) => void;
}

// Mock initial patients data
const initialPatients: Patient[] = [
  { 
    id: "PAT-1001", 
    name: "Abena Owusu", 
    time: "9:00 AM", 
    purpose: "Follow-up",
    status: "pending",
    gender: "female",
    photoUrl: ""
  },
  { 
    id: "PAT-1042", 
    name: "Kofi Mensah", 
    time: "10:30 AM", 
    purpose: "Medication Review",
    status: "attended",
    gender: "male",
    photoUrl: ""
  },
  { 
    id: "PAT-1107", 
    name: "Ama Darko", 
    time: "11:45 AM", 
    purpose: "Lab Results",
    status: "pending",
    gender: "female",
    photoUrl: ""
  },
  { 
    id: "PAT-1205", 
    name: "John Agyekum", 
    time: "2:00 PM", 
    purpose: "New Consultation",
    status: "pending",
    gender: "male",
    photoUrl: ""
  },
  { 
    id: "PAT-1253", 
    name: "Fatima Ibrahim", 
    time: "3:15 PM", 
    purpose: "Follow-up",
    status: "pending",
    gender: "female",
    photoUrl: ""
  },
];

// Generate initial appointments for today
const today = new Date();
const initialAppointments: PatientAppointment[] = initialPatients.map(patient => ({
  id: `APP-${Math.floor(Math.random() * 10000)}`,
  patientId: patient.id,
  date: today.toISOString().split('T')[0],
  time: patient.time,
  purpose: patient.purpose,
  status: patient.status,
}));

// Create historical data for the past 7 days
const pastDays = 7;
let historicalAppointments: PatientAppointment[] = [];

for (let i = 1; i <= pastDays; i++) {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - i);
  const dateStr = pastDate.toISOString().split('T')[0];
  
  // Randomly select 2-4 patients for each past day
  const numPatients = Math.floor(Math.random() * 3) + 2; // 2-4 patients
  const selectedPatients = [...initialPatients]
    .sort(() => 0.5 - Math.random())
    .slice(0, numPatients);
  
  selectedPatients.forEach(patient => {
    historicalAppointments.push({
      id: `APP-${Math.floor(Math.random() * 10000)}`,
      patientId: patient.id,
      date: dateStr,
      time: patient.time,
      purpose: patient.purpose,
      status: Math.random() > 0.3 ? 'attended' : 'pending', // 70% chance of being attended
    });
  });
}

// Create future appointments for next 7 days
const futureDays = 7;
let futureAppointments: PatientAppointment[] = [];

for (let i = 1; i <= futureDays; i++) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + i);
  const dateStr = futureDate.toISOString().split('T')[0];
  
  // Randomly select 1-3 patients for each future day
  const numPatients = Math.floor(Math.random() * 3) + 1; // 1-3 patients
  const selectedPatients = [...initialPatients]
    .sort(() => 0.5 - Math.random())
    .slice(0, numPatients);
  
  selectedPatients.forEach(patient => {
    futureAppointments.push({
      id: `APP-${Math.floor(Math.random() * 10000)}`,
      patientId: patient.id,
      date: dateStr,
      time: patient.time,
      purpose: patient.purpose,
      status: 'pending', // All future appointments are pending
    });
  });
}

// Combine all appointments
const allAppointments = [...initialAppointments, ...historicalAppointments, ...futureAppointments];

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: initialPatients,
  appointments: allAppointments,
  
  getPatientsByDate: (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return get().appointments.filter(appointment => appointment.date === dateStr);
  },
  
  updateAppointmentStatus: (appointmentId: string, status: 'pending' | 'attended') => {
    set(state => ({
      appointments: state.appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status }
          : appointment
      )
    }));
  },
  
  addAppointment: (appointment: Omit<PatientAppointment, 'id'>) => {
    const newAppointment: PatientAppointment = {
      ...appointment,
      id: `APP-${Math.floor(Math.random() * 10000)}`,
    };
    
    set(state => ({
      appointments: [...state.appointments, newAppointment]
    }));
  },
}));

// Helper function to get patient details by ID
export const getPatientById = (patientId: string): Patient | undefined => {
  return usePatientStore.getState().patients.find(patient => patient.id === patientId);
};
