export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string | null
          client_birth_date: string | null
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          total_price: number
          unit_id: string
        }
        Insert: {
          barber_id?: string | null
          client_birth_date?: string | null
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price: number
          unit_id: string
        }
        Update: {
          barber_id?: string | null
          client_birth_date?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          calendar_color: string | null
          commission_rate: number | null
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          unit_id: string
        }
        Insert: {
          calendar_color?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          unit_id: string
        }
        Update: {
          calendar_color?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          birthday_automation_enabled: boolean | null
          birthday_message_template: string | null
          business_name: string | null
          closing_time: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          opening_time: string | null
          rescue_automation_enabled: boolean | null
          rescue_days_threshold: number | null
          rescue_message_template: string | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          birthday_automation_enabled?: boolean | null
          birthday_message_template?: string | null
          business_name?: string | null
          closing_time?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          opening_time?: string | null
          rescue_automation_enabled?: boolean | null
          rescue_days_threshold?: number | null
          rescue_message_template?: string | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          birthday_automation_enabled?: boolean | null
          birthday_message_template?: string | null
          business_name?: string | null
          closing_time?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          opening_time?: string | null
          rescue_automation_enabled?: boolean | null
          rescue_days_threshold?: number | null
          rescue_message_template?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          company_id: string | null
          created_at: string | null
          id: string
          last_visit_at: string | null
          name: string
          notes: string | null
          phone: string
          tags: string[] | null
          total_visits: number | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_visit_at?: string | null
          name: string
          notes?: string | null
          phone: string
          tags?: string[] | null
          total_visits?: number | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_visit_at?: string | null
          name?: string
          notes?: string | null
          phone?: string
          tags?: string[] | null
          total_visits?: number | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          evolution_api_key: string | null
          evolution_instance_name: string | null
          id: string
          name: string
          owner_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          company_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          is_recurring: boolean | null
          payment_method: string | null
          unit_id: string
        }
        Insert: {
          amount: number
          category: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          unit_id: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_sales: {
        Row: {
          appointment_id: string | null
          barber_id: string | null
          client_name: string | null
          client_phone: string | null
          company_id: string | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_date: string
          total_price: number
          unit_id: string
          unit_price: number
        }
        Insert: {
          appointment_id?: string | null
          barber_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          sale_date?: string
          total_price: number
          unit_id: string
          unit_price: number
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_date?: string
          total_price?: number
          unit_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          min_stock_alert: number | null
          name: string
          sale_price: number
          sku: string | null
          stock_quantity: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock_alert?: number | null
          name: string
          sale_price: number
          sku?: string | null
          stock_quantity?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock_alert?: number | null
          name?: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          company_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          unit_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          unit_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          evolution_api_key: string | null
          evolution_instance_name: string | null
          id: string
          is_headquarters: boolean | null
          manager_name: string | null
          name: string
          phone: string | null
          timezone: string | null
          user_id: string
          whatsapp_name: string | null
          whatsapp_phone: string | null
          whatsapp_picture_url: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          is_headquarters?: boolean | null
          manager_name?: string | null
          name: string
          phone?: string | null
          timezone?: string | null
          user_id: string
          whatsapp_name?: string | null
          whatsapp_phone?: string | null
          whatsapp_picture_url?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          is_headquarters?: boolean | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          timezone?: string | null
          user_id?: string
          whatsapp_name?: string | null
          whatsapp_phone?: string | null
          whatsapp_picture_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_company: { Args: { p_company_id: string }; Returns: boolean }
      user_owns_unit: { Args: { unit_id: string }; Returns: boolean }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
