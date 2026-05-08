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
      collaboration_requests: {
        Row: {
          created_at: string
          founder_id: string
          id: string
          message: string | null
          request_type: Database["public"]["Enums"]["collab_request_type"]
          requester_id: string
          requester_role: string
          startup_id: string
          status: Database["public"]["Enums"]["collab_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          founder_id: string
          id?: string
          message?: string | null
          request_type: Database["public"]["Enums"]["collab_request_type"]
          requester_id: string
          requester_role: string
          startup_id: string
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          founder_id?: string
          id?: string
          message?: string | null
          request_type?: Database["public"]["Enums"]["collab_request_type"]
          requester_id?: string
          requester_role?: string
          startup_id?: string
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
        }
        Relationships: []
      }
      event_applications: {
        Row: {
          applicant_id: string
          created_at: string
          event_id: string
          id: string
          startup_id: string
          status: Database["public"]["Enums"]["event_app_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          event_id: string
          id?: string
          startup_id: string
          status?: Database["public"]["Enums"]["event_app_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          event_id?: string
          id?: string
          startup_id?: string
          status?: Database["public"]["Enums"]["event_app_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "innovation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_events: {
        Row: {
          agenda: Json | null
          capacity: number | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          prizes: string | null
          registration_deadline: string | null
          speakers: Json | null
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          university: string | null
          updated_at: string
        }
        Insert: {
          agenda?: Json | null
          capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          prizes?: string | null
          registration_deadline?: string | null
          speakers?: Json | null
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          university?: string | null
          updated_at?: string
        }
        Update: {
          agenda?: Json | null
          capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          prizes?: string | null
          registration_deadline?: string | null
          speakers?: Json | null
          starts_at?: string
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          created_at: string
          geographic_preferences: string[] | null
          id: string
          innovation_categories: string[] | null
          investment_focus: string[] | null
          investor_type: string | null
          max_investment: number | null
          min_investment: number | null
          portfolio_companies: string[] | null
          preferred_stages:
            | Database["public"]["Enums"]["funding_stage"][]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          geographic_preferences?: string[] | null
          id?: string
          innovation_categories?: string[] | null
          investment_focus?: string[] | null
          investor_type?: string | null
          max_investment?: number | null
          min_investment?: number | null
          portfolio_companies?: string[] | null
          preferred_stages?:
            | Database["public"]["Enums"]["funding_stage"][]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          geographic_preferences?: string[] | null
          id?: string
          innovation_categories?: string[] | null
          investment_focus?: string[] | null
          investor_type?: string | null
          max_investment?: number | null
          min_investment?: number | null
          portfolio_companies?: string[] | null
          preferred_stages?:
            | Database["public"]["Enums"]["funding_stage"][]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          availability: string | null
          created_at: string
          expertise: string[] | null
          id: string
          industries: string[] | null
          max_mentees: number | null
          preferred_categories: string[] | null
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          expertise?: string[] | null
          id?: string
          industries?: string[] | null
          max_mentees?: number | null
          preferred_categories?: string[] | null
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          expertise?: string[] | null
          id?: string
          industries?: string[] | null
          max_mentees?: number | null
          preferred_categories?: string[] | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pitch_sessions: {
        Row: {
          collaboration_request_id: string | null
          created_at: string
          duration_minutes: number
          founder_id: string
          id: string
          investor_id: string
          notes: string | null
          room_name: string
          scheduled_at: string
          startup_id: string
          status: Database["public"]["Enums"]["pitch_session_status"]
          updated_at: string
        }
        Insert: {
          collaboration_request_id?: string | null
          created_at?: string
          duration_minutes?: number
          founder_id: string
          id?: string
          investor_id: string
          notes?: string | null
          room_name: string
          scheduled_at: string
          startup_id: string
          status?: Database["public"]["Enums"]["pitch_session_status"]
          updated_at?: string
        }
        Update: {
          collaboration_request_id?: string | null
          created_at?: string
          duration_minutes?: number
          founder_id?: string
          id?: string
          investor_id?: string
          notes?: string | null
          room_name?: string
          scheduled_at?: string
          startup_id?: string
          status?: Database["public"]["Enums"]["pitch_session_status"]
          updated_at?: string
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
      showcase_investors: {
        Row: {
          country: string | null
          created_at: string
          focus: string
          id: string
          initials: string
          investor_type: string
          name: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          focus: string
          id?: string
          initials: string
          investor_type: string
          name: string
        }
        Update: {
          country?: string | null
          created_at?: string
          focus?: string
          id?: string
          initials?: string
          investor_type?: string
          name?: string
        }
        Relationships: []
      }
      showcase_ventures: {
        Row: {
          business_model: string | null
          country: string
          created_at: string
          description: string
          funding_requested: number | null
          id: string
          industry: string
          location: string
          logo_url: string | null
          name: string
          problem_statement: string | null
          solution: string | null
          stage: string
          target_market: string | null
          university: string | null
          website: string | null
        }
        Insert: {
          business_model?: string | null
          country: string
          created_at?: string
          description: string
          funding_requested?: number | null
          id?: string
          industry: string
          location: string
          logo_url?: string | null
          name: string
          problem_statement?: string | null
          solution?: string | null
          stage: string
          target_market?: string | null
          university?: string | null
          website?: string | null
        }
        Update: {
          business_model?: string | null
          country?: string
          created_at?: string
          description?: string
          funding_requested?: number | null
          id?: string
          industry?: string
          location?: string
          logo_url?: string | null
          name?: string
          problem_statement?: string | null
          solution?: string | null
          stage?: string
          target_market?: string | null
          university?: string | null
          website?: string | null
        }
        Relationships: []
      }
      startups: {
        Row: {
          business_model: string | null
          created_at: string
          current_stage: Database["public"]["Enums"]["startup_stage"] | null
          demo_video_url: string | null
          description: string | null
          founder_id: string
          funding_requested: number | null
          funding_stage: Database["public"]["Enums"]["funding_stage"] | null
          id: string
          industry: string | null
          innovation_category: string | null
          is_published: boolean | null
          is_university_project: boolean | null
          logo_url: string | null
          milestones: string[] | null
          name: string
          pitch_deck_url: string | null
          pitch_score: number | null
          problem_statement: string | null
          solution: string | null
          target_market: string | null
          university_name: string | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website: string | null
        }
        Insert: {
          business_model?: string | null
          created_at?: string
          current_stage?: Database["public"]["Enums"]["startup_stage"] | null
          demo_video_url?: string | null
          description?: string | null
          founder_id: string
          funding_requested?: number | null
          funding_stage?: Database["public"]["Enums"]["funding_stage"] | null
          id?: string
          industry?: string | null
          innovation_category?: string | null
          is_published?: boolean | null
          is_university_project?: boolean | null
          logo_url?: string | null
          milestones?: string[] | null
          name: string
          pitch_deck_url?: string | null
          pitch_score?: number | null
          problem_statement?: string | null
          solution?: string | null
          target_market?: string | null
          university_name?: string | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Update: {
          business_model?: string | null
          created_at?: string
          current_stage?: Database["public"]["Enums"]["startup_stage"] | null
          demo_video_url?: string | null
          description?: string | null
          founder_id?: string
          funding_requested?: number | null
          funding_stage?: Database["public"]["Enums"]["funding_stage"] | null
          id?: string
          industry?: string | null
          innovation_category?: string | null
          is_published?: boolean | null
          is_university_project?: boolean | null
          logo_url?: string | null
          milestones?: string[] | null
          name?: string
          pitch_deck_url?: string | null
          pitch_score?: number | null
          problem_statement?: string | null
          solution?: string | null
          target_market?: string | null
          university_name?: string | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Relationships: []
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
      published_startups: {
        Row: {
          business_model: string | null
          city: string | null
          country: string | null
          created_at: string | null
          current_stage: Database["public"]["Enums"]["startup_stage"] | null
          demo_video_url: string | null
          description: string | null
          founder_id: string | null
          founder_name: string | null
          funding_requested: number | null
          funding_stage: Database["public"]["Enums"]["funding_stage"] | null
          id: string | null
          industry: string | null
          innovation_category: string | null
          is_university_project: boolean | null
          logo_url: string | null
          milestones: string[] | null
          name: string | null
          pitch_deck_url: string | null
          problem_statement: string | null
          solution: string | null
          target_market: string | null
          university_name: string | null
          website: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_pitch_deck: { Args: { _object_name: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "founder" | "investor" | "mentor" | "university" | "admin"
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
      event_app_status: "pending" | "accepted" | "rejected" | "withdrawn"
      event_type:
        | "hackathon"
        | "fair"
        | "competition"
        | "demo_day"
        | "pitch_event"
      founder_type: "student" | "independent"
      funding_stage: "pre_seed" | "seed" | "series_a" | "series_b_plus"
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
      app_role: ["founder", "investor", "mentor", "university", "admin"],
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
