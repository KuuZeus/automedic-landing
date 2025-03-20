
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

// Create a direct query function to bypass type checking issues
const directQuery = (table: string) => {
  return supabase.from(table);
};

export type UserRole = 'super_admin' | 'hospital_admin' | 'appointment_manager' | 'analytics_viewer';

type ProfileData = {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  clinic?: string;
  hospital?: string;
  role?: UserRole;
  hospitalId?: string;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  hospitalId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, profileData?: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isRoleAllowed: (allowedRoles: UserRole[]) => boolean;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  canManageUsers: () => boolean;
  canManageAppointments: () => boolean;
  canViewAnalytics: () => boolean;
  canManageSettings: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserRole(null);
          setHospitalId(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, hospital, clinic')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Set user role with default fallback
      setUserRole((data.role as UserRole) || 'appointment_manager');
      
      // For now, we don't have hospital_id yet, so we'll use null
      setHospitalId(null);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserRole('appointment_manager'); // Default role
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      toast.success("Signed in successfully!");
      navigate("/patient-schedule");
    } catch (error: any) {
      toast.error(error.message || "Error signing in");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, profileData?: ProfileData) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData?.firstName || name.split(' ')[0] || '',
            last_name: profileData?.lastName || name.split(' ').slice(1).join(' ') || '',
            specialty: profileData?.specialty || '',
            clinic: profileData?.clinic || '',
            hospital: profileData?.hospital || '',
            role: profileData?.role || 'appointment_manager',
            hospital_id: profileData?.hospitalId || null
          },
        },
      });

      if (error) {
        throw error;
      }
      
      // Create an audit log for user creation
      await createAuditLog('create', 'profiles', email, null, {
        email,
        role: profileData?.role || 'appointment_manager',
        hospital_id: profileData?.hospitalId
      });
      
      toast.success("Account created successfully! Please check your email to verify your account.");
      navigate("/sign-in");
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      navigate("/platform");
    } catch (error: any) {
      toast.error(error.message || "Error signing out");
    } finally {
      setLoading(false);
    }
  };

  const isRoleAllowed = (allowedRoles: UserRole[]): boolean => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setLoading(true);
      
      // Fetch current profile to record previous state
      const { data: oldProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update the user's role
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Create audit log
      await createAuditLog(
        'update', 
        'profiles', 
        userId, 
        { role: oldProfile.role }, 
        { role: newRole }
      );
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error(error.message || "Error updating user role");
    } finally {
      setLoading(false);
    }
  };

  const createAuditLog = async (
    action: string,
    tableName: string,
    recordId: string,
    oldData: any | null,
    newData: any | null
  ) => {
    try {
      if (!user) return;
      
      await directQuery('audit_logs').insert({
        user_id: user.id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  // Permission helper functions
  const canManageUsers = () => {
    return userRole === 'super_admin' || userRole === 'hospital_admin';
  };

  const canManageAppointments = () => {
    return userRole === 'super_admin' || userRole === 'hospital_admin' || userRole === 'appointment_manager';
  };

  const canViewAnalytics = () => {
    return userRole === 'super_admin' || userRole === 'hospital_admin' || userRole === 'analytics_viewer';
  };

  const canManageSettings = () => {
    return userRole === 'super_admin' || (userRole === 'hospital_admin' && hospitalId !== null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user, 
        userRole, 
        hospitalId,
        signIn, 
        signUp, 
        signOut, 
        loading,
        isRoleAllowed,
        updateUserRole,
        canManageUsers,
        canManageAppointments,
        canViewAnalytics,
        canManageSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
