export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          address: string | null
          annual_income: number | null
          applicant_email: string
          applicant_name: string
          application_id: string
          city: string | null
          created_at: string
          credit_score: number | null
          data_sources: string[]
          date_of_birth: string | null
          employment_type: string | null
          existing_loans: number
          gender: string | null
          id: string
          loan_amount: number
          loan_purpose: string
          monthly_emi: number
          notes: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          annual_income?: number | null
          applicant_email: string
          applicant_name: string
          application_id: string
          city?: string | null
          created_at?: string
          credit_score?: number | null
          data_sources?: string[]
          date_of_birth?: string | null
          employment_type?: string | null
          existing_loans?: number
          gender?: string | null
          id?: string
          loan_amount: number
          loan_purpose: string
          monthly_emi?: number
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          annual_income?: number | null
          applicant_email?: string
          applicant_name?: string
          application_id?: string
          city?: string | null
          created_at?: string
          credit_score?: number | null
          data_sources?: string[]
          date_of_birth?: string | null
          employment_type?: string | null
          existing_loans?: number
          gender?: string | null
          id?: string
          loan_amount?: number
          loan_purpose?: string
          monthly_emi?: number
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          performed_by?: string
        }
        Relationships: []
      }
      alerts_notifications: {
        Row: {
          application_id: string | null
          channel: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          message: string
          sent_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          application_id?: string | null
          channel: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          message: string
          sent_at?: string | null
          severity: string
          status?: string
          title: string
        }
        Update: {
          application_id?: string | null
          channel?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          message?: string
          sent_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_name: string
          key_prefix: string
          last_used_at: string | null
          owner_profile_id: string | null
          scopes: string[]
          tenant_configuration_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          owner_profile_id?: string | null
          scopes?: string[]
          tenant_configuration_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          owner_profile_id?: string | null
          scopes?: string[]
          tenant_configuration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_tenant_configuration_id_fkey"
            columns: ["tenant_configuration_id"]
            isOneToOne: false
            referencedRelation: "tenant_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_records: {
        Row: {
          aml_status: string
          application_id: string
          consent_captured: boolean
          created_at: string
          evidence: Json | null
          id: string
          kyc_status: string
          market: string
          permissible_purpose: string
          policy_version: string
          record_status: string
          reviewed_at: string | null
        }
        Insert: {
          aml_status: string
          application_id: string
          consent_captured?: boolean
          created_at?: string
          evidence?: Json | null
          id?: string
          kyc_status: string
          market?: string
          permissible_purpose: string
          policy_version: string
          record_status: string
          reviewed_at?: string | null
        }
        Update: {
          aml_status?: string
          application_id?: string
          consent_captured?: boolean
          created_at?: string
          evidence?: Json | null
          id?: string
          kyc_status?: string
          market?: string
          permissible_purpose?: string
          policy_version?: string
          record_status?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_scores: {
        Row: {
          ai_score: number
          application_id: string
          approval_prob: number | null
          calculated_at: string
          decision: string | null
          decision_reason: string | null
          id: string
          model_version: string
          risk_level: string
          score_factors: Json | null
        }
        Insert: {
          ai_score: number
          application_id: string
          approval_prob?: number | null
          calculated_at?: string
          decision?: string | null
          decision_reason?: string | null
          id?: string
          model_version?: string
          risk_level: string
          score_factors?: Json | null
        }
        Update: {
          ai_score?: number
          application_id?: string
          approval_prob?: number | null
          calculated_at?: string
          decision?: string | null
          decision_reason?: string | null
          id?: string
          model_version?: string
          risk_level?: string
          score_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      data_quality_metrics: {
        Row: {
          application_id: string | null
          created_at: string
          details: Json | null
          id: string
          measured_at: string
          metric_name: string
          metric_value: number
          severity: string
          source_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          measured_at?: string
          metric_name: string
          metric_value: number
          severity?: string
          source_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          measured_at?: string
          metric_name?: string
          metric_value?: number
          severity?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_metrics_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_quality_metrics_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          category: string
          created_at: string
          display_name: string
          id: string
          metadata: Json | null
          provider_name: string
          source_key: string
          status: string
          supports_realtime: boolean
        }
        Insert: {
          category: string
          created_at?: string
          display_name: string
          id?: string
          metadata?: Json | null
          provider_name: string
          source_key: string
          status?: string
          supports_realtime?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string
          id?: string
          metadata?: Json | null
          provider_name?: string
          source_key?: string
          status?: string
          supports_realtime?: boolean
        }
        Relationships: []
      }
      decisions: {
        Row: {
          application_id: string
          created_at: string
          credit_score_id: string | null
          decided_at: string
          decided_by: string | null
          decision_source: string
          decision_status: string
          id: string
          policy_version: string | null
          rationale: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          credit_score_id?: string | null
          decided_at?: string
          decided_by?: string | null
          decision_source?: string
          decision_status: string
          id?: string
          policy_version?: string | null
          rationale?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          credit_score_id?: string | null
          decided_at?: string
          decided_by?: string | null
          decision_source?: string
          decision_status?: string
          id?: string
          policy_version?: string | null
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_credit_score_id_fkey"
            columns: ["credit_score_id"]
            isOneToOne: false
            referencedRelation: "credit_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          extracted_data: Json | null
          file_name: string
          id: string
          processing_status: string
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          extracted_data?: Json | null
          file_name: string
          id?: string
          processing_status?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          extracted_data?: Json | null
          file_name?: string
          id?: string
          processing_status?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_results: {
        Row: {
          champion_version: string | null
          challenger_version: string | null
          completed_at: string | null
          created_at: string
          experiment_name: string
          id: string
          metric_summary: Json | null
          risk_model_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          champion_version?: string | null
          challenger_version?: string | null
          completed_at?: string | null
          created_at?: string
          experiment_name: string
          id?: string
          metric_summary?: Json | null
          risk_model_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          champion_version?: string | null
          challenger_version?: string | null
          completed_at?: string | null
          created_at?: string
          experiment_name?: string
          id?: string
          metric_summary?: Json | null
          risk_model_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_results_risk_model_id_fkey"
            columns: ["risk_model_id"]
            isOneToOne: false
            referencedRelation: "risk_models"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_stores: {
        Row: {
          application_id: string | null
          created_at: string
          feature_namespace: string
          feature_values: Json
          freshness_status: string
          generated_at: string
          id: string
          model_version_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          feature_namespace: string
          feature_values?: Json
          freshness_status?: string
          generated_at?: string
          id?: string
          model_version_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          feature_namespace?: string
          feature_values?: Json
          freshness_status?: string
          generated_at?: string
          id?: string
          model_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_stores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_stores_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_checks: {
        Row: {
          application_id: string
          checked_at: string
          created_at: string
          evidence: Json | null
          fraud_score: number
          id: string
          recommended_action: string
          triggered_rules: string[]
        }
        Insert: {
          application_id: string
          checked_at?: string
          created_at?: string
          evidence?: Json | null
          fraud_score: number
          id?: string
          recommended_action: string
          triggered_rules?: string[]
        }
        Update: {
          application_id?: string
          checked_at?: string
          created_at?: string
          evidence?: Json | null
          fraud_score?: number
          id?: string
          recommended_action?: string
          triggered_rules?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "fraud_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          application_id: string
          created_at: string
          evidence: Json | null
          id: string
          method: string
          provider_name: string
          risk_flags: string[]
          status: string
          verification_score: number
          verified_at: string | null
          verified_fields: string[]
        }
        Insert: {
          application_id: string
          created_at?: string
          evidence?: Json | null
          id?: string
          method: string
          provider_name?: string
          risk_flags?: string[]
          status: string
          verification_score: number
          verified_at?: string | null
          verified_fields?: string[]
        }
        Update: {
          application_id?: string
          created_at?: string
          evidence?: Json | null
          id?: string
          method?: string
          provider_name?: string
          risk_flags?: string[]
          status?: string
          verification_score?: number
          verified_at?: string | null
          verified_fields?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          provisioned_at: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          provisioned_at?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          provisioned_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      model_versions: {
        Row: {
          artifact_uri: string | null
          created_at: string
          drift_score: number | null
          id: string
          metrics: Json | null
          risk_model_id: string
          rollout_percentage: number
          stage: string
          version: string
        }
        Insert: {
          artifact_uri?: string | null
          created_at?: string
          drift_score?: number | null
          id?: string
          metrics?: Json | null
          risk_model_id: string
          rollout_percentage?: number
          stage?: string
          version: string
        }
        Update: {
          artifact_uri?: string | null
          created_at?: string
          drift_score?: number | null
          id?: string
          metrics?: Json | null
          risk_model_id?: string
          rollout_percentage?: number
          stage?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_versions_risk_model_id_fkey"
            columns: ["risk_model_id"]
            isOneToOne: false
            referencedRelation: "risk_models"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          delinquency_rate: number
          id: string
          market: string
          owner_profile_id: string | null
          portfolio_code: string
          portfolio_name: string
          status: string
          tenant_configuration_id: string | null
          total_exposure: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delinquency_rate?: number
          id?: string
          market?: string
          owner_profile_id?: string | null
          portfolio_code: string
          portfolio_name: string
          status?: string
          tenant_configuration_id?: string | null
          total_exposure?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delinquency_rate?: number
          id?: string
          market?: string
          owner_profile_id?: string | null
          portfolio_code?: string
          portfolio_name?: string
          status?: string
          tenant_configuration_id?: string | null
          total_exposure?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_tenant_configuration_id_fkey"
            columns: ["tenant_configuration_id"]
            isOneToOne: false
            referencedRelation: "tenant_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_models: {
        Row: {
          accuracy_auc: number | null
          created_at: string
          deployed_at: string | null
          description: string | null
          id: string
          is_active: boolean
          model_name: string
          precision_score: number | null
          recall_score: number | null
          version: string
        }
        Insert: {
          accuracy_auc?: number | null
          created_at?: string
          deployed_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          model_name: string
          precision_score?: number | null
          recall_score?: number | null
          version: string
        }
        Update: {
          accuracy_auc?: number | null
          created_at?: string
          deployed_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          model_name?: string
          precision_score?: number | null
          recall_score?: number | null
          version?: string
        }
        Relationships: []
      }
      tenant_configurations: {
        Row: {
          branding: Json
          created_at: string
          feature_flags: Json
          id: string
          market: string
          rate_limit_per_minute: number
          status: string
          tenant_name: string
          tenant_slug: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          feature_flags?: Json
          id?: string
          market?: string
          rate_limit_per_minute?: number
          status?: string
          tenant_name: string
          tenant_slug: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          feature_flags?: Json
          id?: string
          market?: string
          rate_limit_per_minute?: number
          status?: string
          tenant_name?: string
          tenant_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          application_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          portfolio_id: string | null
          posted_at: string
          transaction_status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          portfolio_id?: string | null
          posted_at?: string
          transaction_status?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          portfolio_id?: string | null
          posted_at?: string
          transaction_status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_application: {
        Args: { owner_id: string }
        Returns: boolean
      }
      can_manage_credit_scores: {
        Args: never
        Returns: boolean
      }
      can_manage_risk_models: {
        Args: never
        Returns: boolean
      }
      can_view_all_applications: {
        Args: never
        Returns: boolean
      }
      can_view_audit_logs: {
        Args: never
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
