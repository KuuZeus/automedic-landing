export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          address: string | null
          clinic: string | null
          created_at: string
          date: string
          diagnosis: string | null
          email: string | null
          gender: string | null
          has_insurance: boolean | null
          hospital: string | null
          id: string
          insurance_number: string | null
          next_review_date: string | null
          notes: string | null
          occupation: string | null
          patient_id: string
          patient_name: string
          phone_number: string | null
          purpose: string
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic?: string | null
          created_at?: string
          date: string
          diagnosis?: string | null
          email?: string | null
          gender?: string | null
          has_insurance?: boolean | null
          hospital?: string | null
          id?: string
          insurance_number?: string | null
          next_review_date?: string | null
          notes?: string | null
          occupation?: string | null
          patient_id: string
          patient_name: string
          phone_number?: string | null
          purpose: string
          status: string
          time: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic?: string | null
          created_at?: string
          date?: string
          diagnosis?: string | null
          email?: string | null
          gender?: string | null
          has_insurance?: boolean | null
          hospital?: string | null
          id?: string
          insurance_number?: string | null
          next_review_date?: string | null
          notes?: string | null
          occupation?: string | null
          patient_id?: string
          patient_name?: string
          phone_number?: string | null
          purpose?: string
          status?: string
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          facility_name: string
          facility_size: string
          facility_type: string
          id: string
          location: string
          message: string | null
          phone: string
          processed: boolean
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          facility_name: string
          facility_size: string
          facility_type: string
          id?: string
          location: string
          message?: string | null
          phone: string
          processed?: boolean
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          facility_name?: string
          facility_size?: string
          facility_type?: string
          id?: string
          location?: string
          message?: string | null
          phone?: string
          processed?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinic: string | null
          first_name: string | null
          hospital: string | null
          id: string
          last_name: string | null
          role: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          clinic?: string | null
          first_name?: string | null
          hospital?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic?: string | null
          first_name?: string | null
          hospital?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
