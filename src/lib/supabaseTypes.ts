
import { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

// Define types for new tables that aren't in the generated types yet
export interface AuditLog {
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

export interface Hospital {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

// Extended Database type to include our new tables
export type ExtendedDatabase = Database & {
  public: {
    Tables: {
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
      };
      hospitals: {
        Row: Hospital;
        Insert: Omit<Hospital, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Hospital, "id" | "created_at">>;
      };
    } & Database["public"]["Tables"];
  };
};

// Connection details
const SUPABASE_URL = "https://rwtmfnwqucsemrnjnbkx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dG1mbndxdWNzZW1ybmpuYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyOTY3MzksImV4cCI6MjA1Nzg3MjczOX0.MQf-PUq8KU9hXcCQA3Y5B4JkGdS0OQY6EJdaMLL2g8s";

// Create a client with our extended types
export const db = createClient<ExtendedDatabase>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// This function allows us to bypass TypeScript type-checking when using tables
// that are not yet in the generated types
export function createUntypedSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

export const supabaseUntyped = createUntypedSupabaseClient();
