
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { File, User, Calendar } from "lucide-react";

// Direct query function to bypass typing issues
const directQuery = (table: string) => {
  return supabase.from(table);
};

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  user_email?: string;
}

const AuditLogViewer = () => {
  const { userRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Only super admins and hospital admins can view logs
      if (userRole !== 'super_admin' && userRole !== 'hospital_admin') {
        setLoading(false);
        return;
      }
      
      const { data, error } = await directQuery('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      if (data) {
        // Explicitly cast the data to AuditLog[]
        const auditLogs = data as unknown as AuditLog[];
        setLogs(auditLogs);
        
        // Extract unique user IDs
        const userIds = [...new Set(auditLogs.map(log => log.user_id))];
        fetchUserEmails(userIds);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserEmails = async (userIds: string[]) => {
    try {
      // Get user emails for each user ID
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
        
      if (error) throw error;
      
      if (data) {
        const emailMap: Record<string, string> = {};
        data.forEach((user: any) => {
          if (user.id && user.email) {
            emailMap[user.id] = user.email;
          }
        });
        setUserEmails(emailMap);
      }
    } catch (error) {
      console.error('Error fetching user emails:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Show a message if the user doesn't have permission
  if (userRole !== 'super_admin' && userRole !== 'hospital_admin') {
    return (
      <div className="p-6 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
        <p className="font-medium">You don't have permission to view audit logs.</p>
        <p>This feature requires Super Admin or Hospital Admin role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">System Audit Logs</h2>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-4" />
          <p>No audit logs found</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {formatDate(log.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      {userEmails[log.user_id] || log.user_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                      {log.action.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.table_name}</span>
                      <span className="text-xs text-gray-500">{log.record_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button 
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => alert(JSON.stringify({ 
                        old: log.old_data, 
                        new: log.new_data 
                      }, null, 2))}
                    >
                      View Changes
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
