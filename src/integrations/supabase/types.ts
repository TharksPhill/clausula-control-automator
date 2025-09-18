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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_contract_signatures: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          ip_address: string | null
          signature_data: string
          signed_at: string
          signed_html_content: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signed_at?: string
          signed_html_content: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signed_at?: string
          signed_html_content?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          module_id: string | null
          permission_level: Database["public"]["Enums"]["permission_level"]
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          permission_level?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          permission_level?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          last_accessed: string | null
          session_token: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_accessed?: string | null
          session_token: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      administrators: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      autentique_documents: {
        Row: {
          autentique_data: Json | null
          contract_id: string
          contractor_id: string
          created_at: string
          created_by_user: string
          document_id: string
          document_name: string
          id: string
          pdf_file_path: string | null
          public_id: string
          signed_at: string | null
          signer_email: string
          signer_name: string
          status: string
          updated_at: string
        }
        Insert: {
          autentique_data?: Json | null
          contract_id: string
          contractor_id: string
          created_at?: string
          created_by_user: string
          document_id: string
          document_name: string
          id?: string
          pdf_file_path?: string | null
          public_id: string
          signed_at?: string | null
          signer_email: string
          signer_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          autentique_data?: Json | null
          contract_id?: string
          contractor_id?: string
          created_at?: string
          created_by_user?: string
          document_id?: string
          document_name?: string
          id?: string
          pdf_file_path?: string | null
          public_id?: string
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_autentique_documents_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_autentique_documents_contractor_id"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_slip_configurations: {
        Row: {
          created_at: string
          id: string
          institution_name: string
          is_active: boolean
          slip_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_name: string
          is_active?: boolean
          slip_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_name?: string
          is_active?: boolean
          slip_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          clause_data: Json | null
          content: string
          contract_id: string
          contract_shared_id: string | null
          contractor_id: string
          created_at: string
          id: string
          is_system_message: boolean | null
          message_type: string
          metadata: Json | null
          reply_to_message_id: string | null
          sender_name: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          clause_data?: Json | null
          content: string
          contract_id: string
          contract_shared_id?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          message_type?: string
          metadata?: Json | null
          reply_to_message_id?: string | null
          sender_name: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          clause_data?: Json | null
          content?: string
          contract_id?: string
          contract_shared_id?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          is_system_message?: boolean | null
          message_type?: string
          metadata?: Json | null
          reply_to_message_id?: string | null
          sender_name?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_notifications: {
        Row: {
          chat_session_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_id: string
          user_id: string
        }
        Insert: {
          chat_session_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_id: string
          user_id: string
        }
        Update: {
          chat_session_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          contract_id: string
          contractor_id: string
          created_at: string
          id: string
          last_message_at: string
          last_read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          contractor_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          contractor_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_settings: {
        Row: {
          bubble_color: string | null
          created_at: string
          id: string
          join_sound: string | null
          leave_sound: string | null
          message_display_time: number | null
          notification_sound: string | null
          os_notifications: boolean | null
          show_timestamps: boolean | null
          sound_enabled: boolean | null
          sound_volume: number | null
          typing_sound: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bubble_color?: string | null
          created_at?: string
          id?: string
          join_sound?: string | null
          leave_sound?: string | null
          message_display_time?: number | null
          notification_sound?: string | null
          os_notifications?: boolean | null
          show_timestamps?: boolean | null
          sound_enabled?: boolean | null
          sound_volume?: number | null
          typing_sound?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bubble_color?: string | null
          created_at?: string
          id?: string
          join_sound?: string | null
          leave_sound?: string | null
          message_display_time?: number | null
          notification_sound?: string | null
          os_notifications?: boolean | null
          show_timestamps?: boolean | null
          sound_enabled?: boolean | null
          sound_volume?: number | null
          typing_sound?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string
          admin_name: string | null
          cnpj: string | null
          created_at: string
          email: string
          id: string
          logo: string | null
          name: string
          phone: string
          responsible_name: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address: string
          admin_name?: string | null
          cnpj?: string | null
          created_at?: string
          email: string
          id?: string
          logo?: string | null
          name: string
          phone: string
          responsible_name?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string
          admin_name?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          logo?: string | null
          name?: string
          phone?: string
          responsible_name?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_cost_projections: {
        Row: {
          actual_cost: number | null
          company_cost_id: string
          created_at: string
          id: string
          is_edited: boolean | null
          month: number
          notes: string | null
          projected_cost: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          actual_cost?: number | null
          company_cost_id: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          month: number
          notes?: string | null
          projected_cost?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          actual_cost?: number | null
          company_cost_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          month?: number
          notes?: string | null
          projected_cost?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      company_costs: {
        Row: {
          category: string
          cost_type: string
          created_at: string
          description: string
          due_date: string | null
          end_date: string | null
          id: string
          is_active: boolean
          is_recurring: boolean | null
          monthly_cost: number
          projection_end_date: string | null
          projection_start_date: string | null
          recurrence_months: number[] | null
          recurrence_type: string | null
          start_date: string | null
          tax_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          cost_type?: string
          created_at?: string
          description: string
          due_date?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_recurring?: boolean | null
          monthly_cost: number
          projection_end_date?: string | null
          projection_start_date?: string | null
          recurrence_months?: number[] | null
          recurrence_type?: string | null
          start_date?: string | null
          tax_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          cost_type?: string
          created_at?: string
          description?: string
          due_date?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_recurring?: boolean | null
          monthly_cost?: number
          projection_end_date?: string | null
          projection_start_date?: string | null
          recurrence_months?: number[] | null
          recurrence_type?: string | null
          start_date?: string | null
          tax_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          cnpj: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          trade_name: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          trade_name?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          trade_name?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      contract_access_tokens: {
        Row: {
          contract_id: string
          contractor_id: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          token: string
        }
        Insert: {
          contract_id: string
          contractor_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
          token: string
        }
        Update: {
          contract_id?: string
          contractor_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contract_access_tokens_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contract_access_tokens_contractor"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_addons: {
        Row: {
          addon_type: string
          contract_id: string
          created_at: string
          description: string
          effective_date: string | null
          id: string
          new_value: string
          plan_change_details: Json | null
          previous_value: string | null
          request_date: string
          requested_by: string
          updated_at: string
        }
        Insert: {
          addon_type: string
          contract_id: string
          created_at?: string
          description: string
          effective_date?: string | null
          id?: string
          new_value: string
          plan_change_details?: Json | null
          previous_value?: string | null
          request_date?: string
          requested_by: string
          updated_at?: string
        }
        Update: {
          addon_type?: string
          contract_id?: string
          created_at?: string
          description?: string
          effective_date?: string | null
          id?: string
          new_value?: string
          plan_change_details?: Json | null
          previous_value?: string | null
          request_date?: string
          requested_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_addons_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_adjustment_locks: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          is_locked: boolean
          locked_at: string
          locked_by: string
          renewal_year: number
          unlock_reason: string | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          is_locked?: boolean
          locked_at?: string
          locked_by: string
          renewal_year: number
          unlock_reason?: string | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          locked_at?: string
          locked_by?: string
          renewal_year?: number
          unlock_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_adjustment_locks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_adjustments: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["contract_adjustment_type"]
          adjustment_value: number
          contract_id: string
          created_at: string
          effective_date: string
          id: string
          new_value: number
          notes: string | null
          previous_value: number
          renewal_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_type: Database["public"]["Enums"]["contract_adjustment_type"]
          adjustment_value: number
          contract_id: string
          created_at?: string
          effective_date: string
          id?: string
          new_value: number
          notes?: string | null
          previous_value: number
          renewal_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["contract_adjustment_type"]
          adjustment_value?: number
          contract_id?: string
          created_at?: string
          effective_date?: string
          id?: string
          new_value?: number
          notes?: string | null
          previous_value?: number
          renewal_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_adjustments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_analysis_view_settings: {
        Row: {
          column_name: string
          column_order: number
          created_at: string
          custom_label: string | null
          display_format: string
          id: string
          is_visible: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          column_name: string
          column_order?: number
          created_at?: string
          custom_label?: string | null
          display_format: string
          id?: string
          is_visible?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          column_name?: string
          column_order?: number
          created_at?: string
          custom_label?: string | null
          display_format?: string
          id?: string
          is_visible?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_attachments: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_bank_slip_costs: {
        Row: {
          applied_at: string
          bank_slip_config_id: string
          billing_start_month: number
          contract_id: string
          created_at: string
          id: string
          is_recurring: boolean
          monthly_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          bank_slip_config_id: string
          billing_start_month?: number
          contract_id: string
          created_at?: string
          id?: string
          is_recurring?: boolean
          monthly_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          bank_slip_config_id?: string
          billing_start_month?: number
          contract_id?: string
          created_at?: string
          id?: string
          is_recurring?: boolean
          monthly_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_bank_slip_costs_bank_slip_config_id_fkey"
            columns: ["bank_slip_config_id"]
            isOneToOne: false
            referencedRelation: "bank_slip_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_cost_configurations: {
        Row: {
          client_trial_period_days: number | null
          contract_id: string
          cost_plan_id: string
          created_at: string
          fixed_cost_percentage: number | null
          id: string
          labor_cost_percentage: number | null
          tax_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_trial_period_days?: number | null
          contract_id: string
          cost_plan_id: string
          created_at?: string
          fixed_cost_percentage?: number | null
          id?: string
          labor_cost_percentage?: number | null
          tax_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_trial_period_days?: number | null
          contract_id?: string
          cost_plan_id?: string
          created_at?: string
          fixed_cost_percentage?: number | null
          id?: string
          labor_cost_percentage?: number | null
          tax_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_docusign_envelopes: {
        Row: {
          company_signature_data: string | null
          company_signed_at: string | null
          contract_id: string
          contractor_id: string
          contractor_signature_data: string | null
          contractor_signed_at: string | null
          created_at: string
          docusign_data: Json | null
          envelope_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_signature_data?: string | null
          company_signed_at?: string | null
          contract_id: string
          contractor_id: string
          contractor_signature_data?: string | null
          contractor_signed_at?: string | null
          created_at?: string
          docusign_data?: Json | null
          envelope_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_signature_data?: string | null
          company_signed_at?: string | null
          contract_id?: string
          contractor_id?: string
          contractor_signature_data?: string | null
          contractor_signed_at?: string | null
          created_at?: string
          docusign_data?: Json | null
          envelope_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_monthly_revenue_overrides: {
        Row: {
          contract_id: string
          created_at: string
          description: string | null
          id: string
          month: number
          notes: string | null
          updated_at: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          description?: string | null
          id?: string
          month: number
          notes?: string | null
          updated_at?: string
          user_id: string
          value: number
          year: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          description?: string | null
          id?: string
          month?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      contract_profit_analysis: {
        Row: {
          allocated_company_costs: number | null
          allocated_employee_costs: number | null
          contract_id: string
          contract_value: number
          created_at: string
          gross_profit: number | null
          id: string
          license_cost: number | null
          notes: string | null
          profit_margin: number | null
          total_costs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocated_company_costs?: number | null
          allocated_employee_costs?: number | null
          contract_id: string
          contract_value: number
          created_at?: string
          gross_profit?: number | null
          id?: string
          license_cost?: number | null
          notes?: string | null
          profit_margin?: number | null
          total_costs?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocated_company_costs?: number | null
          allocated_employee_costs?: number | null
          contract_id?: string
          contract_value?: number
          created_at?: string
          gross_profit?: number | null
          id?: string
          license_cost?: number | null
          notes?: string | null
          profit_margin?: number | null
          total_costs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contract_profit_analysis_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewal_exemptions: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          reason: string | null
          renewal_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          reason?: string | null
          renewal_year: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          renewal_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_revisions: {
        Row: {
          contract_id: string
          created_at: string
          created_by_id: string
          created_by_type: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by_id: string | null
          reviewed_by_type: string | null
          revision_data: Json
          revision_number: number
          revision_type: string
          status: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by_id: string
          created_by_type: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          reviewed_by_type?: string | null
          revision_data: Json
          revision_number?: number
          revision_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by_id?: string
          created_by_type?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          reviewed_by_type?: string | null
          revision_data?: Json
          revision_number?: number
          revision_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_revisions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_status_history: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: string
          status_date: string
          status_type: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status: string
          status_date: string
          status_type: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          status_date?: string
          status_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_status_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_plan_requests: {
        Row: {
          contract_id: string
          contractor_profile_id: string
          current_monthly_value: string
          current_plan_type: string
          id: string
          justification: string | null
          requested_at: string
          requested_monthly_value: string
          requested_plan_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          contract_id: string
          contractor_profile_id: string
          current_monthly_value: string
          current_plan_type: string
          id?: string
          justification?: string | null
          requested_at?: string
          requested_monthly_value: string
          requested_plan_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          contract_id?: string
          contractor_profile_id?: string
          current_monthly_value?: string
          current_plan_type?: string
          id?: string
          justification?: string | null
          requested_at?: string
          requested_monthly_value?: string
          requested_plan_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contractor_plan_requests_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contractor_plan_requests_profile"
            columns: ["contractor_profile_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_profiles: {
        Row: {
          contractor_id: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          password_hash: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          password_hash: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          password_hash?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contractor_rejections: {
        Row: {
          admin_explanation: string | null
          contract_id: string
          contractor_id: string
          created_at: string
          id: string
          plan_change_id: string | null
          reason: string
          rejected_at: string
          rejection_type: string
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          admin_explanation?: string | null
          contract_id: string
          contractor_id: string
          created_at?: string
          id?: string
          plan_change_id?: string | null
          reason: string
          rejected_at?: string
          rejection_type: string
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          admin_explanation?: string | null
          contract_id?: string
          contractor_id?: string
          created_at?: string
          id?: string
          plan_change_id?: string | null
          reason?: string
          rejected_at?: string
          rejection_type?: string
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      contractor_sessions: {
        Row: {
          contractor_profile_id: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          contractor_profile_id: string
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          contractor_profile_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contractor_sessions_profile"
            columns: ["contractor_profile_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          address: string
          city: string
          cnae_descricao: string | null
          cnae_principal: string | null
          cnaes_secundarios: Json | null
          cnpj: string
          contract_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          responsible_cpf: string
          responsible_name: string
          responsible_rg: string | null
          segmento: string | null
          state: string
        }
        Insert: {
          address: string
          city: string
          cnae_descricao?: string | null
          cnae_principal?: string | null
          cnaes_secundarios?: Json | null
          cnpj: string
          contract_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          responsible_cpf: string
          responsible_name: string
          responsible_rg?: string | null
          segmento?: string | null
          state: string
        }
        Update: {
          address?: string
          city?: string
          cnae_descricao?: string | null
          cnae_principal?: string | null
          cnaes_secundarios?: Json | null
          cnpj?: string
          contract_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          responsible_cpf?: string
          responsible_name?: string
          responsible_rg?: string | null
          segmento?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractors_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          anual_discount: string | null
          cnpj_count: string
          company_id: string
          contract_number: string
          created_at: string
          employee_count: string
          id: string
          monthly_value: string
          payment_day: string
          payment_start_date: string
          plan_type: string | null
          reactivation_date: string | null
          renewal_date: string
          revision_status: string | null
          semestral_discount: string | null
          start_date: string
          status: string | null
          termination_date: string | null
          trial_days: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anual_discount?: string | null
          cnpj_count: string
          company_id: string
          contract_number: string
          created_at?: string
          employee_count: string
          id?: string
          monthly_value: string
          payment_day: string
          payment_start_date: string
          plan_type?: string | null
          reactivation_date?: string | null
          renewal_date: string
          revision_status?: string | null
          semestral_discount?: string | null
          start_date: string
          status?: string | null
          termination_date?: string | null
          trial_days: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anual_discount?: string | null
          cnpj_count?: string
          company_id?: string
          contract_number?: string
          created_at?: string
          employee_count?: string
          id?: string
          monthly_value?: string
          payment_day?: string
          payment_start_date?: string
          plan_type?: string | null
          reactivation_date?: string | null
          renewal_date?: string
          revision_status?: string | null
          semestral_discount?: string | null
          start_date?: string
          status?: string | null
          termination_date?: string | null
          trial_days?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_plan_changes: {
        Row: {
          change_reason: string | null
          changed_by_user_id: string
          contract_id: string | null
          cost_plan_id: string
          created_at: string
          effective_date: string
          id: string
          new_cost: number
          previous_cost: number | null
        }
        Insert: {
          change_reason?: string | null
          changed_by_user_id: string
          contract_id?: string | null
          cost_plan_id: string
          created_at?: string
          effective_date?: string
          id?: string
          new_cost: number
          previous_cost?: number | null
        }
        Update: {
          change_reason?: string | null
          changed_by_user_id?: string
          contract_id?: string | null
          cost_plan_id?: string
          created_at?: string
          effective_date?: string
          id?: string
          new_cost?: number
          previous_cost?: number | null
        }
        Relationships: []
      }
      cost_plans: {
        Row: {
          base_license_cost: number
          billing_type: string
          created_at: string
          description: string | null
          early_payment_discount_percentage: number | null
          exemption_period_months: number | null
          id: string
          is_active: boolean
          max_cnpjs: number | null
          max_employees: number | null
          min_employees: number | null
          name: string
          projected_plan_value: number | null
          projected_quantity: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_license_cost?: number
          billing_type?: string
          created_at?: string
          description?: string | null
          early_payment_discount_percentage?: number | null
          exemption_period_months?: number | null
          id?: string
          is_active?: boolean
          max_cnpjs?: number | null
          max_employees?: number | null
          min_employees?: number | null
          name: string
          projected_plan_value?: number | null
          projected_quantity?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_license_cost?: number
          billing_type?: string
          created_at?: string
          description?: string | null
          early_payment_discount_percentage?: number | null
          exemption_period_months?: number | null
          id?: string
          is_active?: boolean
          max_cnpjs?: number | null
          max_employees?: number | null
          min_employees?: number | null
          name?: string
          projected_plan_value?: number | null
          projected_quantity?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      docusign_configurations: {
        Row: {
          account_id: string
          auth_server: string
          base_url: string
          created_at: string
          id: string
          integration_key: string
          is_active: boolean
          rsa_private_key: string
          updated_at: string
          user_id: string
          user_id_docusign: string
        }
        Insert: {
          account_id: string
          auth_server?: string
          base_url?: string
          created_at?: string
          id?: string
          integration_key: string
          is_active?: boolean
          rsa_private_key: string
          updated_at?: string
          user_id: string
          user_id_docusign: string
        }
        Update: {
          account_id?: string
          auth_server?: string
          base_url?: string
          created_at?: string
          id?: string
          integration_key?: string
          is_active?: boolean
          rsa_private_key?: string
          updated_at?: string
          user_id?: string
          user_id_docusign?: string
        }
        Relationships: []
      }
      employee_costs: {
        Row: {
          benefits: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: string
          salary: number
          taxes: number | null
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position: string
          salary: number
          taxes?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: string
          salary?: number
          taxes?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          section_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          section_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          section_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "financial_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_sections: {
        Row: {
          color_scheme: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          operation_type: string
          order_index: number
          revenue_type: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_scheme: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          operation_type?: string
          order_index?: number
          revenue_type?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_scheme?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          operation_type?: string
          order_index?: number
          revenue_type?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_maps_configurations: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_routes_configurations: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      justification_reviews: {
        Row: {
          admin_explanation: string | null
          contract_id: string
          contractor_id: string
          created_at: string
          id: string
          rejection_id: string
          review_status: string
          reviewed_at: string
          reviewed_by: string
          updated_at: string
        }
        Insert: {
          admin_explanation?: string | null
          contract_id: string
          contractor_id: string
          created_at?: string
          id?: string
          rejection_id: string
          review_status: string
          reviewed_at?: string
          reviewed_by: string
          updated_at?: string
        }
        Update: {
          admin_explanation?: string | null
          contract_id?: string
          contractor_id?: string
          created_at?: string
          id?: string
          rejection_id?: string
          review_status?: string
          reviewed_at?: string
          reviewed_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_financial_costs: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_projection: boolean | null
          month: number
          notes: string | null
          updated_at: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_projection?: boolean | null
          month: number
          notes?: string | null
          updated_at?: string
          user_id: string
          value?: number
          year: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_projection?: boolean | null
          month?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_financial_costs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          check_frequency_hours: number | null
          contract_expiry_days: number
          contract_expiry_email: boolean | null
          contract_expiry_subject: string | null
          contract_signed_email: boolean | null
          contract_signed_subject: string | null
          created_at: string
          custom_email: string | null
          email_days_of_week: string[] | null
          email_notifications: boolean
          email_send_time: string | null
          id: string
          new_contract_email: boolean | null
          new_contract_subject: string | null
          plan_change_email: boolean | null
          plan_change_subject: string | null
          trial_expiry_days: number
          trial_expiry_email: boolean | null
          trial_expiry_subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_frequency_hours?: number | null
          contract_expiry_days?: number
          contract_expiry_email?: boolean | null
          contract_expiry_subject?: string | null
          contract_signed_email?: boolean | null
          contract_signed_subject?: string | null
          created_at?: string
          custom_email?: string | null
          email_days_of_week?: string[] | null
          email_notifications?: boolean
          email_send_time?: string | null
          id?: string
          new_contract_email?: boolean | null
          new_contract_subject?: string | null
          plan_change_email?: boolean | null
          plan_change_subject?: string | null
          trial_expiry_days?: number
          trial_expiry_email?: boolean | null
          trial_expiry_subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_frequency_hours?: number | null
          contract_expiry_days?: number
          contract_expiry_email?: boolean | null
          contract_expiry_subject?: string | null
          contract_signed_email?: boolean | null
          contract_signed_subject?: string | null
          created_at?: string
          custom_email?: string | null
          email_days_of_week?: string[] | null
          email_notifications?: boolean
          email_send_time?: string | null
          id?: string
          new_contract_email?: boolean | null
          new_contract_subject?: string | null
          plan_change_email?: boolean | null
          plan_change_subject?: string | null
          trial_expiry_days?: number
          trial_expiry_email?: boolean | null
          trial_expiry_subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          contract_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addon_costs: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          plan_addon_id: string
          sales_projection: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          plan_addon_id: string
          sales_projection?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          plan_addon_id?: string
          sales_projection?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_addon_costs_plan_addon_id_fkey"
            columns: ["plan_addon_id"]
            isOneToOne: false
            referencedRelation: "plan_addons"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addons: {
        Row: {
          created_at: string | null
          description: string
          features: string[] | null
          id: string
          is_active: boolean
          license_cost: number
          name: string
          package_increment: number | null
          package_ranges: Json | null
          price_per_unit: number
          pricing_type: string | null
          unit_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          license_cost?: number
          name: string
          package_increment?: number | null
          package_ranges?: Json | null
          price_per_unit?: number
          pricing_type?: string | null
          unit_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          license_cost?: number
          name?: string
          package_increment?: number | null
          package_ranges?: Json | null
          price_per_unit?: number
          pricing_type?: string | null
          unit_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          allowed_cnpjs: number
          annual_price: number
          created_at: string | null
          employee_range: string
          features: string[] | null
          id: string
          is_active: boolean
          license_cost: number | null
          license_exemption_months: number | null
          monthly_price: number
          name: string
          semestral_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_cnpjs?: number
          annual_price?: number
          created_at?: string | null
          employee_range: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          license_cost?: number | null
          license_exemption_months?: number | null
          monthly_price?: number
          name: string
          semestral_price?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_cnpjs?: number
          annual_price?: number
          created_at?: string | null
          employee_range?: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          license_cost?: number | null
          license_exemption_months?: number | null
          monthly_price?: number
          name?: string
          semestral_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_profit_analysis: {
        Row: {
          boleto_cost: number
          created_at: string
          fixed_cost_allocation: number
          gross_profit: number
          id: string
          margin_percentage: number
          net_profit: number
          product_id: string
          selling_price: number
          tax_cost: number
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boleto_cost?: number
          created_at?: string
          fixed_cost_allocation?: number
          gross_profit?: number
          id?: string
          margin_percentage?: number
          net_profit?: number
          product_id: string
          selling_price?: number
          tax_cost?: number
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          boleto_cost?: number
          created_at?: string
          fixed_cost_allocation?: number
          gross_profit?: number
          id?: string
          margin_percentage?: number
          net_profit?: number
          product_id?: string
          selling_price?: number
          tax_cost?: number
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_profit_analysis_product_id"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          customer_shipping_cost: number
          id: string
          individual_tax_percentage: number
          installments: number | null
          ipi_type: string
          ipi_value: number
          is_active: boolean
          name: string
          payment_method: string
          quantity: number | null
          sales_projection: number
          selling_price: number
          shipping_cost: number
          supplier_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_shipping_cost?: number
          id?: string
          individual_tax_percentage?: number
          installments?: number | null
          ipi_type?: string
          ipi_value?: number
          is_active?: boolean
          name: string
          payment_method?: string
          quantity?: number | null
          sales_projection?: number
          selling_price?: number
          shipping_cost?: number
          supplier_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_shipping_cost?: number
          id?: string
          individual_tax_percentage?: number
          installments?: number | null
          ipi_type?: string
          ipi_value?: number
          is_active?: boolean
          name?: string
          payment_method?: string
          quantity?: number | null
          sales_projection?: number
          selling_price?: number
          shipping_cost?: number
          supplier_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prolabore: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_value: number
          name: string
          percentage: number
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_value?: number
          name: string
          percentage?: number
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_value?: number
          name?: string
          percentage?: number
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_access_tokens: {
        Row: {
          accessed_at: string | null
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          quote_id: string
          token: string
        }
        Insert: {
          accessed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
          quote_id: string
          token: string
        }
        Update: {
          accessed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          quote_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_access_tokens_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_company: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          custom_plan_data: Json | null
          expires_at: string | null
          features: string[] | null
          id: string
          notes: string | null
          quote_number: string
          selected_plan_id: string | null
          status: string | null
          system_description: string | null
          system_name: string
          total_value: number | null
          updated_at: string
          user_id: string
          validity_days: number | null
        }
        Insert: {
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          custom_plan_data?: Json | null
          expires_at?: string | null
          features?: string[] | null
          id?: string
          notes?: string | null
          quote_number: string
          selected_plan_id?: string | null
          status?: string | null
          system_description?: string | null
          system_name: string
          total_value?: number | null
          updated_at?: string
          user_id: string
          validity_days?: number | null
        }
        Update: {
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          custom_plan_data?: Json | null
          expires_at?: string | null
          features?: string[] | null
          id?: string
          notes?: string | null
          quote_number?: string
          selected_plan_id?: string | null
          status?: string | null
          system_description?: string | null
          system_name?: string
          total_value?: number | null
          updated_at?: string
          user_id?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      signed_contracts: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          contract_id: string
          contractor_id: string
          contractor_profile_id: string | null
          id: string
          ip_address: string | null
          is_cancelled: boolean
          signature_data: string
          signed_at: string
          signed_html_content: string
          user_agent: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          contract_id: string
          contractor_id: string
          contractor_profile_id?: string | null
          id?: string
          ip_address?: string | null
          is_cancelled?: boolean
          signature_data: string
          signed_at?: string
          signed_html_content: string
          user_agent?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          contract_id?: string
          contractor_id?: string
          contractor_profile_id?: string | null
          id?: string
          ip_address?: string | null
          is_cancelled?: boolean
          signature_data?: string
          signed_at?: string
          signed_html_content?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_signed_contracts_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_signed_contracts_contractor"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_signed_contracts_contractor_profile"
            columns: ["contractor_profile_id"]
            isOneToOne: false
            referencedRelation: "contractor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signwell_configurations: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          module_key: string
          name: string
          parent_module_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_key: string
          name: string
          parent_module_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_key?: string
          name?: string
          parent_module_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_modules_parent_module_id_fkey"
            columns: ["parent_module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_visit_services: {
        Row: {
          created_at: string
          description: string | null
          estimated_hours: number | null
          fixed_price: number | null
          id: string
          is_active: boolean
          name: string
          pricing_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          fixed_price?: number | null
          id?: string
          is_active?: boolean
          name: string
          pricing_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          fixed_price?: number | null
          id?: string
          is_active?: boolean
          name?: string
          pricing_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      technical_visit_settings: {
        Row: {
          created_at: string
          id: string
          km_cost: number
          updated_at: string
          user_id: string
          visit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          km_cost?: number
          updated_at?: string
          user_id: string
          visit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          km_cost?: number
          updated_at?: string
          user_id?: string
          visit_cost?: number
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean | null
          last_seen: string | null
          typing_in_chat: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          typing_in_chat?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          typing_in_chat?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_settings: {
        Row: {
          annual_insurance: number | null
          annual_ipva: number | null
          annual_maintenance: number | null
          annual_mileage: number | null
          brand: string
          created_at: string
          current_estimated_value: number | null
          depreciation_rate: number | null
          fuel_consumption: number | null
          fuel_price: number | null
          fuel_type: string | null
          id: string
          is_active: boolean
          license_plate: string | null
          model: string
          purchase_value: number | null
          updated_at: string
          user_id: string
          vehicle_type: string | null
          year: number
        }
        Insert: {
          annual_insurance?: number | null
          annual_ipva?: number | null
          annual_maintenance?: number | null
          annual_mileage?: number | null
          brand: string
          created_at?: string
          current_estimated_value?: number | null
          depreciation_rate?: number | null
          fuel_consumption?: number | null
          fuel_price?: number | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          license_plate?: string | null
          model: string
          purchase_value?: number | null
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
          year: number
        }
        Update: {
          annual_insurance?: number | null
          annual_ipva?: number | null
          annual_maintenance?: number | null
          annual_mileage?: number | null
          brand?: string
          created_at?: string
          current_estimated_value?: number | null
          depreciation_rate?: number | null
          fuel_consumption?: number | null
          fuel_price?: number | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean
          license_plate?: string | null
          model?: string
          purchase_value?: number | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      chat_sessions_view: {
        Row: {
          contract_id: string | null
          contract_number: string | null
          contractor_id: string | null
          contractor_name: string | null
          id: string | null
          is_online: boolean | null
          last_message: string | null
          last_message_at: string | null
          unread_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_login: {
        Args: { p_email: string; p_password: string }
        Returns: {
          admin_id: string
          email: string
          expires_at: string
          name: string
          session_token: string
        }[]
      }
      calculate_adjustment_effective_date: {
        Args: { p_adjustment_date?: string; p_contract_id: string }
        Returns: string
      }
      calculate_product_fixed_cost_allocation: {
        Args:
          | { p_sales_projection?: number; p_user_id: string }
          | { p_user_id: string }
        Returns: number
      }
      check_admin_permission: {
        Args: {
          p_admin_id: string
          p_module_key: string
          p_required_level?: Database["public"]["Enums"]["permission_level"]
        }
        Returns: boolean
      }
      deactivate_administrator: {
        Args: { p_admin_id: string }
        Returns: Json
      }
      generate_company_cost_projections: {
        Args: {
          p_company_cost_id: string
          p_end_year?: number
          p_months?: number[]
          p_start_year?: number
          p_user_id: string
        }
        Returns: undefined
      }
      generate_company_cost_projections_smart: {
        Args: {
          p_company_cost_id: string
          p_end_date: string
          p_start_date: string
          p_update_future_only?: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      generate_company_cost_projections_with_dates: {
        Args: {
          p_company_cost_id: string
          p_end_date: string
          p_start_date: string
          p_user_id: string
        }
        Returns: undefined
      }
      generate_contract_access_token: {
        Args: {
          p_contract_id: string
          p_contractor_id: string
          p_expires_in_hours?: number
        }
        Returns: string
      }
      generate_contract_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_quote_access_token: {
        Args: { p_expires_in_hours?: number; p_quote_id: string }
        Returns: string
      }
      get_admin_modules_permissions: {
        Args: { p_admin_id: string }
        Returns: {
          module_id: string
          module_key: string
          module_name: string
          parent_module_id: string
          permission_level: Database["public"]["Enums"]["permission_level"]
        }[]
      }
      get_company_costs_by_period: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          category: string
          cost_id: string
          cost_type: string
          description: string
          monthly_cost: number
        }[]
      }
      get_company_costs_by_period_with_due_date: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          category: string
          cost_id: string
          cost_type: string
          description: string
          due_date: string
          is_due_this_month: boolean
          monthly_cost: number
        }[]
      }
      get_google_maps_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_google_routes_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_monthly_cost_summary: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          actual: number
          has_actual_data: boolean
          projected: number
          variance: number
        }[]
      }
      get_user_chat_settings: {
        Args: { p_user_id: string }
        Returns: {
          bubble_color: string
          join_sound: string
          leave_sound: string
          message_display_time: number
          notification_sound: string
          os_notifications: boolean
          show_timestamps: boolean
          sound_enabled: boolean
          sound_volume: number
          typing_sound: string
        }[]
      }
      list_administrators: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          created_by: string
          email: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      recalculate_product_profit_analysis: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      save_google_maps_config: {
        Args: { p_api_key: string; p_user_id: string }
        Returns: undefined
      }
      save_google_routes_config: {
        Args: { p_api_key: string; p_user_id: string }
        Returns: undefined
      }
      update_administrator: {
        Args: {
          p_admin_id: string
          p_email?: string
          p_name?: string
          p_password?: string
        }
        Returns: Json
      }
      update_product_profit_analysis_manual: {
        Args: { product_data: Database["public"]["Tables"]["products"]["Row"] }
        Returns: undefined
      }
      update_projection_forward_only: {
        Args: { p_new_cost: number; p_notes?: string; p_projection_id: string }
        Returns: undefined
      }
      update_user_presence: {
        Args: {
          p_is_online?: boolean
          p_typing_in_chat?: string
          p_user_id: string
        }
        Returns: undefined
      }
      validate_admin_session: {
        Args: { p_session_token: string }
        Returns: {
          admin_id: string
          email: string
          is_valid: boolean
          name: string
        }[]
      }
      validate_contract_access_token: {
        Args: { p_token: string }
        Returns: {
          contract_id: string
          contractor_id: string
          is_valid: boolean
        }[]
      }
      validate_quote_access_token: {
        Args: { p_token: string }
        Returns: {
          is_valid: boolean
          quote_id: string
        }[]
      }
    }
    Enums: {
      contract_adjustment_type: "value" | "percentage"
      notification_type:
        | "contract_expiry"
        | "trial_expiry"
        | "new_contract"
        | "contract_signed"
        | "plan_change"
      permission_level: "none" | "read" | "write"
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
      contract_adjustment_type: ["value", "percentage"],
      notification_type: [
        "contract_expiry",
        "trial_expiry",
        "new_contract",
        "contract_signed",
        "plan_change",
      ],
      permission_level: ["none", "read", "write"],
    },
  },
} as const
