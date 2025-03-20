
import { supabase } from "@/integrations/supabase/client";

// Create a type-safe direct query to bypass type checking issues
const directQuery = (table: string) => {
  return supabase.from(table);
};

export const createAuditLog = async (
  action: 'create' | 'update' | 'delete',
  tableName: string,
  recordId: string,
  oldData: any | null,
  newData: any | null
) => {
  try {
    const { error } = await directQuery('audit_logs').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData
    });
    
    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (error) {
    console.error('Error in createAuditLog:', error);
  }
};

export const logAppointmentCreation = async (appointmentData: any) => {
  return createAuditLog(
    'create',
    'appointments',
    appointmentData.id || 'new-appointment',
    null,
    appointmentData
  );
};

export const logAppointmentUpdate = async (appointmentId: string, oldData: any, newData: any) => {
  return createAuditLog(
    'update',
    'appointments',
    appointmentId,
    oldData,
    newData
  );
};

export const logUserRoleChange = async (userId: string, oldRole: string, newRole: string) => {
  return createAuditLog(
    'update',
    'profiles',
    userId,
    { role: oldRole },
    { role: newRole }
  );
};

export const logHospitalCreation = async (hospitalData: any) => {
  return createAuditLog(
    'create',
    'hospitals',
    hospitalData.id || 'new-hospital',
    null,
    hospitalData
  );
};
