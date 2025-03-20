
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNav from "@/components/AuthNav";
import Footer from "@/components/Footer";
import { useAuth, UserRole } from "@/contexts/AuthContext";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Hospital, UserCog, Shield } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  hospital_id: string | null;
  hospital: string | null;
  clinic: string | null;
}

interface HospitalOption {
  id: string;
  name: string;
}

const UsersPage = () => {
  const { userRole, user, loading: authLoading, isRoleAllowed, updateUserRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'appointment_manager' as UserRole,
    hospitalId: ''
  });
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);

  useEffect(() => {
    if (!authLoading) {
      // Redirect if not an admin
      if (user && !isRoleAllowed(['super_admin', 'hospital_admin'])) {
        toast.error("You don't have permission to access this page.");
        navigate('/patient-schedule');
      } else if (user) {
        fetchHospitals();
        fetchUsers();
      } else if (!user) {
        navigate('/sign-in');
      }
    }
  }, [user, authLoading, isRoleAllowed, navigate]);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        setHospitals(data);
        
        // If there's at least one hospital, set it as default for new users
        if (data.length > 0) {
          setNewUser(prev => ({ ...prev, hospitalId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users with their profile data
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      
      if (users) {
        // Fetch associated profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Combine users with profiles
        const userProfiles: UserProfile[] = users.map(u => {
          const profile = profiles?.find(p => p.id === u.id) || {};
          return {
            id: u.id,
            email: u.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            role: (profile.role as UserRole) || 'appointment_manager',
            hospital_id: profile.hospital_id || null,
            hospital: profile.hospital || null,
            clinic: profile.clinic || null
          };
        });
        
        setUsers(userProfiles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.firstName) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Get the selected hospital name
      const selectedHospital = hospitals.find(h => h.id === newUser.hospitalId);
      
      // Create user with Supabase Auth
      const { error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            role: newUser.role,
            hospital_id: newUser.hospitalId,
            hospital: selectedHospital?.name || ''
          }
        }
      });
      
      if (error) throw error;
      
      toast.success('User added successfully!');
      setIsAddUserOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'appointment_manager',
        hospitalId: hospitals[0]?.id || ''
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error changing role:', error);
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-health-600 hover:bg-health-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and assign permissions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Create a strong password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment_manager">Appointment Manager</SelectItem>
                        <SelectItem value="analytics_viewer">Analytics Viewer</SelectItem>
                        <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                        {userRole === 'super_admin' && (
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital</Label>
                    <Select
                      value={newUser.hospitalId}
                      onValueChange={(value) => setNewUser({ ...newUser, hospitalId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-health-600 hover:bg-health-700"
                    onClick={handleAddUser}
                  >
                    Add User
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
              <Skeleton className="h-12 w-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="text-gray-500">Click 'Add User' to create a new user account.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <div className="font-medium">
                          {userProfile.first_name} {userProfile.last_name}
                        </div>
                      </TableCell>
                      <TableCell>{userProfile.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Hospital className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{userProfile.hospital || 'Not assigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-gray-500" />
                          {userRole === 'super_admin' || (userRole === 'hospital_admin' && userProfile.role !== 'super_admin') ? (
                            <Select
                              value={userProfile.role}
                              onValueChange={(value: UserRole) => handleRoleChange(userProfile.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="appointment_manager">Appointment Manager</SelectItem>
                                <SelectItem value="analytics_viewer">Analytics Viewer</SelectItem>
                                <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                                {userRole === 'super_admin' && (
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                              {userProfile.role === 'super_admin' ? 'Super Admin' : 
                               userProfile.role === 'hospital_admin' ? 'Hospital Admin' : 
                               userProfile.role === 'appointment_manager' ? 'Appointment Manager' : 
                               'Analytics Viewer'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-8">
                          <UserCog className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
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

export default UsersPage;
