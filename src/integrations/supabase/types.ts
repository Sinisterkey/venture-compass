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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      connection_requests: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["connection_direction"]
          due_diligence_granted: boolean
          id: string
          initiator_id: string
          message: string | null
          organization_id: string
          recipient_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["connection_direction"]
          due_diligence_granted?: boolean
          id?: string
          initiator_id: string
          message?: string | null
          organization_id: string
          recipient_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["connection_direction"]
          due_diligence_granted?: boolean
          id?: string
          initiator_id?: string
          message?: string | null
          organization_id?: string
          recipient_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_matches: {
        Row: {
          computed_at: string
          created_at: string
          gaps: string[] | null
          id: string
          is_dismissed: boolean | null
          is_saved: boolean | null
          opportunity_id: string
          organization_id: string
          owner_id: string
          reasons: string[] | null
          score: number
          updated_at: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          gaps?: string[] | null
          id?: string
          is_dismissed?: boolean | null
          is_saved?: boolean | null
          opportunity_id: string
          organization_id: string
          owner_id: string
          reasons?: string[] | null
          score: number
          updated_at?: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          gaps?: string[] | null
          id?: string
          is_dismissed?: boolean | null
          is_saved?: boolean | null
          opportunity_id?: string
          organization_id?: string
          owner_id?: string
          reasons?: string[] | null
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "funding_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_opportunities: {
        Row: {
          beneficiary_types: string[] | null
          countries: string[] | null
          created_at: string
          currency: string | null
          deadline: string | null
          funder: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          max_amount: number | null
          min_amount: number | null
          sdgs: number[] | null
          sectors: string[] | null
          source: string | null
          summary: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          beneficiary_types?: string[] | null
          countries?: string[] | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          funder: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          sdgs?: number[] | null
          sectors?: string[] | null
          source?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          beneficiary_types?: string[] | null
          countries?: string[] | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          funder?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          sdgs?: number[] | null
          sectors?: string[] | null
          source?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      impact_updates: {
        Row: {
          amount_spent: number | null
          author_id: string
          beneficiaries_count: number | null
          created_at: string
          currency: string | null
          id: string
          milestone_type: string | null
          narrative: string | null
          organization_id: string
          period_end: string | null
          period_start: string | null
          photos: string[] | null
          receipts: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_spent?: number | null
          author_id: string
          beneficiaries_count?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          milestone_type?: string | null
          narrative?: string | null
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          photos?: string[] | null
          receipts?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_spent?: number | null
          author_id?: string
          beneficiaries_count?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          milestone_type?: string | null
          narrative?: string | null
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          photos?: string[] | null
          receipts?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          bio: string | null
          created_at: string
          geographic_preferences: string[] | null
          id: string
          innovation_categories: string[] | null
          investment_focus: string[] | null
          investor_type: string | null
          is_verified: boolean | null
          max_investment: number | null
          min_investment: number | null
          organization_name: string | null
          portfolio_companies: string[] | null
          preferred_beneficiaries: string[] | null
          preferred_countries: string[] | null
          preferred_sdgs: number[] | null
          preferred_stages:
            | Database["public"]["Enums"]["funding_stage"][]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          geographic_preferences?: string[] | null
          id?: string
          innovation_categories?: string[] | null
          investment_focus?: string[] | null
          investor_type?: string | null
          is_verified?: boolean | null
          max_investment?: number | null
          min_investment?: number | null
          organization_name?: string | null
          portfolio_companies?: string[] | null
          preferred_beneficiaries?: string[] | null
          preferred_countries?: string[] | null
          preferred_sdgs?: number[] | null
          preferred_stages?:
            | Database["public"]["Enums"]["funding_stage"][]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          geographic_preferences?: string[] | null
          id?: string
          innovation_categories?: string[] | null
          investment_focus?: string[] | null
          investor_type?: string | null
          is_verified?: boolean | null
          max_investment?: number | null
          min_investment?: number | null
          organization_name?: string | null
          portfolio_companies?: string[] | null
          preferred_beneficiaries?: string[] | null
          preferred_countries?: string[] | null
          preferred_sdgs?: number[] | null
          preferred_stages?:
            | Database["public"]["Enums"]["funding_stage"][]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string | null
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_bookmarks: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_bookmarks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_likes: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_likes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          organization_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          organization_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_profile_views: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          owner_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          owner_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          owner_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_profile_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          created_at: string
          description: string | null
          doc_type: string | null
          id: string
          organization_id: string
          storage_path: string
          title: string
          uploader_id: string
          visibility: Database["public"]["Enums"]["doc_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_type?: string | null
          id?: string
          organization_id: string
          storage_path: string
          title: string
          uploader_id: string
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_type?: string | null
          id?: string
          organization_id?: string
          storage_path?: string
          title?: string
          uploader_id?: string
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_last_analyzed_at: string | null
          ai_strengths: string[] | null
          ai_suggestions: string[] | null
          ai_weaknesses: string[] | null
          beneficiary_type: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          founded_year: number | null
          funding_probability: number | null
          funding_required: number | null
          id: string
          impact_area: string | null
          is_published: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          mission: string | null
          name: string
          owner_id: string
          phone: string | null
          province: string | null
          readiness_score: number | null
          sdgs: number[] | null
          sector: string | null
          short_description: string | null
          stage: Database["public"]["Enums"]["org_stage"] | null
          target_beneficiaries: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          ai_last_analyzed_at?: string | null
          ai_strengths?: string[] | null
          ai_suggestions?: string[] | null
          ai_weaknesses?: string[] | null
          beneficiary_type?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          founded_year?: number | null
          funding_probability?: number | null
          funding_required?: number | null
          id?: string
          impact_area?: string | null
          is_published?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          mission?: string | null
          name: string
          owner_id: string
          phone?: string | null
          province?: string | null
          readiness_score?: number | null
          sdgs?: number[] | null
          sector?: string | null
          short_description?: string | null
          stage?: Database["public"]["Enums"]["org_stage"] | null
          target_beneficiaries?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          ai_last_analyzed_at?: string | null
          ai_strengths?: string[] | null
          ai_suggestions?: string[] | null
          ai_weaknesses?: string[] | null
          beneficiary_type?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          founded_year?: number | null
          funding_probability?: number | null
          funding_required?: number | null
          id?: string
          impact_area?: string | null
          is_published?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          province?: string | null
          readiness_score?: number | null
          sdgs?: number[] | null
          sector?: string | null
          short_description?: string | null
          stage?: Database["public"]["Enums"]["org_stage"] | null
          target_beneficiaries?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string
          deadline: string | null
          funder_name: string | null
          id: string
          is_published: boolean
          organization_id: string
          owner_id: string
          published_at: string | null
          sections: Json
          status: string
          summary: string | null
          template_key: string
          title: string
          total_words: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          funder_name?: string | null
          id?: string
          is_published?: boolean
          organization_id: string
          owner_id: string
          published_at?: string | null
          sections?: Json
          status?: string
          summary?: string | null
          template_key: string
          title: string
          total_words?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          funder_name?: string | null
          id?: string
          is_published?: boolean
          organization_id?: string
          owner_id?: string
          published_at?: string | null
          sections?: Json
          status?: string
          summary?: string | null
          template_key?: string
          title?: string
          total_words?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          founder_type: Database["public"]["Enums"]["founder_type"]
          government_id_url: string | null
          id: string
          reviewed_by: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["verification_status"]
          student_id_url: string | null
          university_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          founder_type: Database["public"]["Enums"]["founder_type"]
          government_id_url?: string | null
          id?: string
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id_url?: string | null
          university_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          founder_type?: Database["public"]["Enums"]["founder_type"]
          government_id_url?: string | null
          id?: string
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id_url?: string | null
          university_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_accepted_connection: {
        Args: { _org_id: string; _viewer: string }
        Returns: boolean
      }
      has_due_diligence: {
        Args: { _org_id: string; _viewer: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "founder" | "investor" | "ngo"
      collab_request_type:
        | "pitch_session"
        | "meeting"
        | "prototype_demo"
        | "additional_info"
        | "funding_interest"
        | "offer_mentorship"
        | "strategy_discussion"
        | "technical_discussion"
      collab_status: "pending" | "accepted" | "declined"
      connection_direction: "ngo_to_investor" | "investor_to_ngo"
      connection_status: "pending" | "accepted" | "declined"
      doc_visibility: "protected" | "confidential"
      event_app_status: "pending" | "accepted" | "rejected" | "withdrawn"
      event_type:
        | "hackathon"
        | "fair"
        | "competition"
        | "demo_day"
        | "pitch_event"
      founder_type: "student" | "independent"
      funding_stage: "pre_seed" | "seed" | "series_a" | "series_b_plus"
      investor_type:
        | "individual"
        | "foundation"
        | "grant_maker"
        | "development_partner"
        | "corporate"
        | "impact_fund"
      org_stage: "idea" | "early" | "established" | "scaling" | "mature"
      pitch_session_status: "scheduled" | "live" | "completed" | "cancelled"
      startup_stage: "idea" | "prototype" | "mvp" | "pilot" | "revenue"
      verification_status:
        | "pending"
        | "approved"
        | "rejected"
        | "more_info_needed"
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
      app_role: ["admin", "founder", "investor", "ngo"],
      collab_request_type: [
        "pitch_session",
        "meeting",
        "prototype_demo",
        "additional_info",
        "funding_interest",
        "offer_mentorship",
        "strategy_discussion",
        "technical_discussion",
      ],
      collab_status: ["pending", "accepted", "declined"],
      connection_direction: ["ngo_to_investor", "investor_to_ngo"],
      connection_status: ["pending", "accepted", "declined"],
      doc_visibility: ["protected", "confidential"],
      event_app_status: ["pending", "accepted", "rejected", "withdrawn"],
      event_type: [
        "hackathon",
        "fair",
        "competition",
        "demo_day",
        "pitch_event",
      ],
      founder_type: ["student", "independent"],
      funding_stage: ["pre_seed", "seed", "series_a", "series_b_plus"],
      investor_type: [
        "individual",
        "foundation",
        "grant_maker",
        "development_partner",
        "corporate",
        "impact_fund",
      ],
      org_stage: ["idea", "early", "established", "scaling", "mature"],
      pitch_session_status: ["scheduled", "live", "completed", "cancelled"],
      startup_stage: ["idea", "prototype", "mvp", "pilot", "revenue"],
      verification_status: [
        "pending",
        "approved",
        "rejected",
        "more_info_needed",
      ],
    },
  },
} as const
