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
      appointment_deletions: {
        Row: {
          appointment_id: string
          barber_name: string
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          deleted_at: string
          deleted_by: string
          deletion_reason: string
          id: string
          original_status: string
          payment_method: string | null
          scheduled_time: string
          service_name: string
          total_price: number
          unit_id: string
        }
        Insert: {
          appointment_id: string
          barber_name: string
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by: string
          deletion_reason: string
          id?: string
          original_status: string
          payment_method?: string | null
          scheduled_time: string
          service_name: string
          total_price?: number
          unit_id: string
        }
        Update: {
          appointment_id?: string
          barber_name?: string
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by?: string
          deletion_reason?: string
          id?: string
          original_status?: string
          payment_method?: string | null
          scheduled_time?: string
          service_name?: string
          total_price?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_deletions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_deletions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          barber_id: string | null
          client_birth_date: string | null
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          dependent_id: string | null
          end_time: string
          id: string
          is_dependent: boolean | null
          notes: string | null
          payment_method: string | null
          service_id: string | null
          source: string | null
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
          dependent_id?: string | null
          end_time: string
          id?: string
          is_dependent?: boolean | null
          notes?: string | null
          payment_method?: string | null
          service_id?: string | null
          source?: string | null
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
          dependent_id?: string | null
          end_time?: string
          id?: string
          is_dependent?: boolean | null
          notes?: string | null
          payment_method?: string | null
          service_id?: string | null
          source?: string | null
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
            foreignKeyName: "appointments_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "client_dependents"
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
      automation_logs: {
        Row: {
          appointment_id: string | null
          automation_type: string
          client_id: string | null
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          sent_at: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          automation_type: string
          client_id?: string | null
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          automation_type?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          credit_card_fee_percent: number | null
          debit_card_fee_percent: number | null
          email: string | null
          id: string
          invite_token: string | null
          is_active: boolean | null
          lunch_break_enabled: boolean | null
          lunch_break_end: string | null
          lunch_break_start: string | null
          name: string
          phone: string | null
          photo_url: string | null
          unit_id: string
          user_id: string | null
        }
        Insert: {
          calendar_color?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          credit_card_fee_percent?: number | null
          debit_card_fee_percent?: number | null
          email?: string | null
          id?: string
          invite_token?: string | null
          is_active?: boolean | null
          lunch_break_enabled?: boolean | null
          lunch_break_end?: string | null
          lunch_break_start?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          unit_id: string
          user_id?: string | null
        }
        Update: {
          calendar_color?: string | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          credit_card_fee_percent?: number | null
          debit_card_fee_percent?: number | null
          email?: string | null
          id?: string
          invite_token?: string | null
          is_active?: boolean | null
          lunch_break_enabled?: boolean | null
          lunch_break_end?: string | null
          lunch_break_start?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          unit_id?: string
          user_id?: string | null
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
      business_hours: {
        Row: {
          closing_time: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          opening_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closing_time?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          opening_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closing_time?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          opening_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          appointment_reminder_enabled: boolean | null
          appointment_reminder_minutes: number | null
          appointment_reminder_template: string | null
          automation_send_hour: number | null
          automation_send_minute: number | null
          birthday_automation_enabled: boolean | null
          birthday_message_template: string | null
          business_name: string | null
          cancellation_time_limit_minutes: number | null
          closing_time: string | null
          commission_calculation_base: string | null
          created_at: string | null
          credit_card_fee_percent: number | null
          debit_card_fee_percent: number | null
          deletion_password_enabled: boolean | null
          deletion_password_hash: string | null
          deletion_password_reset_expires: string | null
          deletion_password_reset_token: string | null
          fidelity_cuts_threshold: number | null
          fidelity_min_value: number | null
          fidelity_program_enabled: boolean | null
          id: string
          late_cancellation_fee_percent: number | null
          logo_url: string | null
          no_show_fee_percent: number | null
          opening_time: string | null
          rescue_automation_enabled: boolean | null
          rescue_days_threshold: number | null
          rescue_message_template: string | null
          updated_at: string | null
          user_id: string
          vocal_cancellation_enabled: boolean | null
          vocal_confirmation_enabled: boolean | null
          vocal_notification_enabled: boolean | null
          webhook_url: string | null
        }
        Insert: {
          appointment_reminder_enabled?: boolean | null
          appointment_reminder_minutes?: number | null
          appointment_reminder_template?: string | null
          automation_send_hour?: number | null
          automation_send_minute?: number | null
          birthday_automation_enabled?: boolean | null
          birthday_message_template?: string | null
          business_name?: string | null
          cancellation_time_limit_minutes?: number | null
          closing_time?: string | null
          commission_calculation_base?: string | null
          created_at?: string | null
          credit_card_fee_percent?: number | null
          debit_card_fee_percent?: number | null
          deletion_password_enabled?: boolean | null
          deletion_password_hash?: string | null
          deletion_password_reset_expires?: string | null
          deletion_password_reset_token?: string | null
          fidelity_cuts_threshold?: number | null
          fidelity_min_value?: number | null
          fidelity_program_enabled?: boolean | null
          id?: string
          late_cancellation_fee_percent?: number | null
          logo_url?: string | null
          no_show_fee_percent?: number | null
          opening_time?: string | null
          rescue_automation_enabled?: boolean | null
          rescue_days_threshold?: number | null
          rescue_message_template?: string | null
          updated_at?: string | null
          user_id: string
          vocal_cancellation_enabled?: boolean | null
          vocal_confirmation_enabled?: boolean | null
          vocal_notification_enabled?: boolean | null
          webhook_url?: string | null
        }
        Update: {
          appointment_reminder_enabled?: boolean | null
          appointment_reminder_minutes?: number | null
          appointment_reminder_template?: string | null
          automation_send_hour?: number | null
          automation_send_minute?: number | null
          birthday_automation_enabled?: boolean | null
          birthday_message_template?: string | null
          business_name?: string | null
          cancellation_time_limit_minutes?: number | null
          closing_time?: string | null
          commission_calculation_base?: string | null
          created_at?: string | null
          credit_card_fee_percent?: number | null
          debit_card_fee_percent?: number | null
          deletion_password_enabled?: boolean | null
          deletion_password_hash?: string | null
          deletion_password_reset_expires?: string | null
          deletion_password_reset_token?: string | null
          fidelity_cuts_threshold?: number | null
          fidelity_min_value?: number | null
          fidelity_program_enabled?: boolean | null
          id?: string
          late_cancellation_fee_percent?: number | null
          logo_url?: string | null
          no_show_fee_percent?: number | null
          opening_time?: string | null
          rescue_automation_enabled?: boolean | null
          rescue_days_threshold?: number | null
          rescue_message_template?: string | null
          updated_at?: string | null
          user_id?: string
          vocal_cancellation_enabled?: boolean | null
          vocal_confirmation_enabled?: boolean | null
          vocal_notification_enabled?: boolean | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      campaign_message_logs: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          recipient_name: string | null
          recipient_phone: string
          recipient_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_name?: string | null
          recipient_phone: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_name?: string | null
          recipient_phone?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_message_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_history: {
        Row: {
          appointment_id: string | null
          barber_name: string
          cancellation_source: string
          cancelled_at: string
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          id: string
          is_late_cancellation: boolean
          is_no_show: boolean
          minutes_before: number
          notes: string | null
          scheduled_time: string
          service_name: string
          total_price: number
          unit_id: string
        }
        Insert: {
          appointment_id?: string | null
          barber_name: string
          cancellation_source?: string
          cancelled_at?: string
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_late_cancellation?: boolean
          is_no_show?: boolean
          minutes_before?: number
          notes?: string | null
          scheduled_time: string
          service_name: string
          total_price?: number
          unit_id: string
        }
        Update: {
          appointment_id?: string | null
          barber_name?: string
          cancellation_source?: string
          cancelled_at?: string
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_late_cancellation?: boolean
          is_no_show?: boolean
          minutes_before?: number
          notes?: string | null
          scheduled_time?: string
          service_name?: string
          total_price?: number
          unit_id?: string
        }
        Relationships: []
      }
      client_dependents: {
        Row: {
          birth_date: string | null
          client_id: string
          company_id: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          relationship: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          client_id: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          relationship?: string | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          client_id?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          relationship?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_dependents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_dependents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_dependents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          available_courtesies: number | null
          birth_date: string | null
          company_id: string | null
          created_at: string | null
          id: string
          last_visit_at: string | null
          loyalty_cuts: number | null
          marketing_opt_out: boolean | null
          name: string
          notes: string | null
          opted_out_at: string | null
          phone: string
          tags: string[] | null
          total_courtesies_earned: number | null
          total_visits: number | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          available_courtesies?: number | null
          birth_date?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_visit_at?: string | null
          loyalty_cuts?: number | null
          marketing_opt_out?: boolean | null
          name: string
          notes?: string | null
          opted_out_at?: string | null
          phone: string
          tags?: string[] | null
          total_courtesies_earned?: number | null
          total_visits?: number | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          available_courtesies?: number | null
          birth_date?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_visit_at?: string | null
          loyalty_cuts?: number | null
          marketing_opt_out?: boolean | null
          name?: string
          notes?: string | null
          opted_out_at?: string | null
          phone?: string
          tags?: string[] | null
          total_courtesies_earned?: number | null
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
          is_blocked: boolean | null
          is_partner: boolean | null
          last_login_at: string | null
          monthly_price: number | null
          name: string
          owner_user_id: string
          partner_ends_at: string | null
          partner_notes: string | null
          partner_renewed_count: number | null
          partner_started_at: string | null
          plan_status: string | null
          plan_type: string | null
          signup_source: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          is_blocked?: boolean | null
          is_partner?: boolean | null
          last_login_at?: string | null
          monthly_price?: number | null
          name: string
          owner_user_id: string
          partner_ends_at?: string | null
          partner_notes?: string | null
          partner_renewed_count?: number | null
          partner_started_at?: string | null
          plan_status?: string | null
          plan_type?: string | null
          signup_source?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_instance_name?: string | null
          id?: string
          is_blocked?: boolean | null
          is_partner?: boolean | null
          last_login_at?: string | null
          monthly_price?: number | null
          name?: string
          owner_user_id?: string
          partner_ends_at?: string | null
          partner_notes?: string | null
          partner_renewed_count?: number | null
          partner_started_at?: string | null
          plan_status?: string | null
          plan_type?: string | null
          signup_source?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
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
      feedbacks: {
        Row: {
          admin_notes: string | null
          company_id: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          resolved_at: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          media_type: string | null
          media_url: string | null
          message_template: string
          sent_count: number
          status: string
          total_recipients: number
          unit_id: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_template: string
          sent_count?: number
          status?: string
          total_recipients?: number
          unit_id?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_template?: string
          sent_count?: number
          status?: string
          total_recipients?: number
          unit_id?: string | null
        }
        Relationships: []
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
      page_visits: {
        Row: {
          id: string
          ip_hash: string | null
          page_path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visited_at: string | null
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          page_path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string | null
        }
        Update: {
          id?: string
          ip_hash?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string | null
        }
        Relationships: []
      }
      partnership_terms: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          title: string
          version: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          version: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_terms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string | null
          display_order: number | null
          feature_key: string
          feature_name: string
          feature_type: string
          franquias_value: string | null
          id: string
          inicial_value: string | null
          profissional_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          feature_key: string
          feature_name: string
          feature_type: string
          franquias_value?: string | null
          id?: string
          inicial_value?: string | null
          profissional_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          feature_key?: string
          feature_name?: string
          feature_type?: string
          franquias_value?: string | null
          id?: string
          inicial_value?: string | null
          profissional_value?: string | null
          updated_at?: string | null
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
          payment_method: string | null
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
          payment_method?: string | null
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
          payment_method?: string | null
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
      saas_settings: {
        Row: {
          annual_discount_percent: number | null
          default_trial_days: number | null
          elite_plan_price: number | null
          empire_plan_price: number | null
          franquias_plan_annual_price: number | null
          franquias_plan_price: number | null
          google_conversion_id: string | null
          google_tag_id: string | null
          id: string
          inicial_plan_annual_price: number | null
          inicial_plan_price: number | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          meta_access_token: string | null
          meta_pixel_id: string | null
          professional_plan_price: number | null
          profissional_plan_annual_price: number | null
          profissional_plan_price: number | null
          stripe_live_publishable_key: string | null
          stripe_live_secret_key: string | null
          stripe_mode: string | null
          stripe_test_publishable_key: string | null
          stripe_test_secret_key: string | null
          stripe_webhook_secret: string | null
          tiktok_pixel_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          annual_discount_percent?: number | null
          default_trial_days?: number | null
          elite_plan_price?: number | null
          empire_plan_price?: number | null
          franquias_plan_annual_price?: number | null
          franquias_plan_price?: number | null
          google_conversion_id?: string | null
          google_tag_id?: string | null
          id?: string
          inicial_plan_annual_price?: number | null
          inicial_plan_price?: number | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          meta_access_token?: string | null
          meta_pixel_id?: string | null
          professional_plan_price?: number | null
          profissional_plan_annual_price?: number | null
          profissional_plan_price?: number | null
          stripe_live_publishable_key?: string | null
          stripe_live_secret_key?: string | null
          stripe_mode?: string | null
          stripe_test_publishable_key?: string | null
          stripe_test_secret_key?: string | null
          stripe_webhook_secret?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          annual_discount_percent?: number | null
          default_trial_days?: number | null
          elite_plan_price?: number | null
          empire_plan_price?: number | null
          franquias_plan_annual_price?: number | null
          franquias_plan_price?: number | null
          google_conversion_id?: string | null
          google_tag_id?: string | null
          id?: string
          inicial_plan_annual_price?: number | null
          inicial_plan_price?: number | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          meta_access_token?: string | null
          meta_pixel_id?: string | null
          professional_plan_price?: number | null
          profissional_plan_annual_price?: number | null
          profissional_plan_price?: number | null
          stripe_live_publishable_key?: string | null
          stripe_live_secret_key?: string | null
          stripe_mode?: string | null
          stripe_test_publishable_key?: string | null
          stripe_test_secret_key?: string | null
          stripe_webhook_secret?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
      term_acceptances: {
        Row: {
          accepted_at: string
          barber_id: string
          commission_rate_snapshot: number
          content_snapshot: string
          id: string
          ip_address: string | null
          term_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          barber_id: string
          commission_rate_snapshot: number
          content_snapshot: string
          id?: string
          ip_address?: string | null
          term_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          barber_id?: string
          commission_rate_snapshot?: number
          content_snapshot?: string
          id?: string
          ip_address?: string | null
          term_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_acceptances_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_acceptances_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "partnership_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          agenda_api_key: string | null
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
          agenda_api_key?: string | null
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
          agenda_api_key?: string | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      barber_has_pending_term: {
        Args: { _barber_id: string }
        Returns: boolean
      }
      generate_agenda_api_key: { Args: never; Returns: string }
      get_barber_by_user_id: {
        Args: { _user_id: string }
        Returns: {
          calendar_color: string | null
          commission_rate: number | null
          company_id: string | null
          created_at: string
          credit_card_fee_percent: number | null
          debit_card_fee_percent: number | null
          email: string | null
          id: string
          invite_token: string | null
          is_active: boolean | null
          lunch_break_enabled: boolean | null
          lunch_break_end: string | null
          lunch_break_start: string | null
          name: string
          phone: string | null
          photo_url: string | null
          unit_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "barbers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_campaign_failed: { Args: { cid: string }; Returns: undefined }
      increment_campaign_sent: { Args: { cid: string }; Returns: undefined }
      is_super_admin: { Args: never; Returns: boolean }
      sanitize_brazilian_phone: {
        Args: { p_unit_id?: string; raw_phone: string }
        Returns: string
      }
      user_owns_company: { Args: { p_company_id: string }; Returns: boolean }
      user_owns_unit: { Args: { unit_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "barber" | "super_admin"
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
      app_role: ["owner", "barber", "super_admin"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
