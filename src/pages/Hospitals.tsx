
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Building, Users, Plus, Pencil } from "lucide-react";

// Create a direct query function to bypass type checking issues
const directQuery = (table: string) => {
  return supabase.from(table);
};

interface Hospital {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

const HospitalsPage = () => {
  const { userRole, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (user && userRole === 'super_admin') {
        fetchHospitals();
      } else if (user && userRole !== 'super_admin') {
        toast.error("You don't have permission to access this page.");
        navigate('/patient-schedule');
      } else if (!user) {
        navigate('/sign-in');
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await directQuery('hospitals')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        // Get user counts per hospital - temporarily simplified for now
        const hospitalsWithCounts = data.map((hospital: any) => ({
          ...hospital,
          user_count: 0
        }));
        
        setHospitals(hospitalsWithCounts as Hospital[]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHospital = async () => {
    try {
      if (!newHospitalName.trim()) {
        toast.error('Please enter a hospital name');
        return;
      }
      
      const { data, error } = await directQuery('hospitals')
        .insert({ name: newHospitalName.trim() })
        .select();
        
      if (error) throw error;
      
      toast.success(`Hospital "${newHospitalName}" added successfully!`);
      setIsAddHospitalOpen(false);
      setNewHospitalName('');
      
      // Add the new hospital to the state
      if (data) {
        setHospitals(prev => [...prev, { ...data[0], user_count: 0 }] as Hospital[]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add hospital');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
              <p className="text-gray-600">Manage hospitals in the system</p>
            </div>
            
            <Dialog open={isAddHospitalOpen} onOpenChange={setIsAddHospitalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-health-600 hover:bg-health-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hospital
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Hospital</DialogTitle>
                  <DialogDescription>
                    Create a new hospital in the system.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospitalName">Hospital Name</Label>
                    <Input
                      id="hospitalName"
                      value={newHospitalName}
                      onChange={(e) => setNewHospitalName(e.target.value)}
                      placeholder="Enter hospital name"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddHospitalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-health-600 hover:bg-health-700"
                    onClick={handleAddHospital}
                  >
                    Add Hospital
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hospitals found</h3>
              <p className="text-gray-500">Click 'Add Hospital' to create a new hospital.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-5 w-5 mr-2 text-gray-500" /> 
                          <span className="font-medium">{hospital.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{hospital.user_count || 0} users</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(hospital.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Users className="h-4 w-4 mr-2" />
                            View Users
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HospitalsPage;
