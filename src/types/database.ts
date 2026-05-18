export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          profile_id: string
          reaction: string | null
          read_at: string | null
        }
        Insert: {
          announcement_id: string
          profile_id: string
          reaction?: string | null
          read_at?: string | null
        }
        Update: {
          announcement_id?: string
          profile_id?: string
          reaction?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "announcement_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          body: string
          created_at: string | null
          expires_at: string | null
          id: string
          organization_id: string | null
          priority: string | null
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appreciations: {
        Row: {
          created_at: string | null
          from_profile_id: string | null
          id: string
          is_public: boolean | null
          message: string
          organization_id: string | null
          service_id: string | null
          to_profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_profile_id?: string | null
          id?: string
          is_public?: boolean | null
          message: string
          organization_id?: string | null
          service_id?: string | null
          to_profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_profile_id?: string | null
          id?: string
          is_public?: boolean | null
          message?: string
          organization_id?: string | null
          service_id?: string | null
          to_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appreciations_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "appreciations_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appreciations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appreciations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appreciations_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "appreciations_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          checked_in_at: string | null
          created_at: string | null
          id: string
          paired_with: string | null
          pairing_role: string | null
          profile_id: string | null
          responded_at: string | null
          service_id: string | null
          skill_id: string | null
          status: string | null
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string | null
          id?: string
          paired_with?: string | null
          pairing_role?: string | null
          profile_id?: string | null
          responded_at?: string | null
          service_id?: string | null
          skill_id?: string | null
          status?: string | null
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string | null
          id?: string
          paired_with?: string | null
          pairing_role?: string | null
          profile_id?: string | null
          responded_at?: string | null
          service_id?: string | null
          skill_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_paired_with_fkey"
            columns: ["paired_with"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "assignments_paired_with_fkey"
            columns: ["paired_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      member_skills: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          level_reached_at: string | null
          profile_id: string | null
          skill_id: string | null
          trained_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          level_reached_at?: string | null
          profile_id?: string | null
          skill_id?: string | null
          trained_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          level_reached_at?: string | null
          profile_id?: string | null
          skill_id?: string | null
          trained_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "member_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_skills_trained_by_fkey"
            columns: ["trained_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "member_skills_trained_by_fkey"
            columns: ["trained_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          id: string
          link: string | null
          profile_id: string | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          id?: string
          link?: string | null
          profile_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          id?: string
          link?: string | null
          profile_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          greeting_style: string | null
          id: string
          name: string
          slug: string
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          greeting_style?: string | null
          id?: string
          name: string
          slug: string
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          greeting_style?: string | null
          id?: string
          name?: string
          slug?: string
          timezone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          preferred_name: string | null
          role: string | null
          why_i_serve: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          joined_at?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          role?: string | null
          why_i_serve?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          role?: string | null
          why_i_serve?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          profile_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          profile_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          profile_id: string | null
          rating: string | null
          service_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          rating?: string | null
          service_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string | null
          rating?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "service_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          created_by: string | null
          id: string
          location: string | null
          notes: string | null
          organization_id: string | null
          service_date: string
          spiritual_theme: string | null
          start_time: string
          status: string | null
          title: string
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string | null
          service_date: string
          spiritual_theme?: string | null
          start_time: string
          status?: string | null
          title: string
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string | null
          service_date?: string
          spiritual_theme?: string | null
          start_time?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_content: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          organization_id: string | null
          publish_date: string
          reference: string | null
          title: string | null
          type: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          publish_date: string
          reference?: string | null
          title?: string | null
          type: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          publish_date?: string
          reference?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "spiritual_content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_content_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_public: boolean | null
          organization_id: string | null
          profile_id: string | null
          service_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          organization_id?: string | null
          profile_id?: string | null
          service_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          organization_id?: string | null
          profile_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "testimonies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      unavailabilities: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          profile_id: string | null
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          profile_id?: string | null
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          profile_id?: string | null
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "unavailabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "member_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unavailabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_stats: {
        Row: {
          appreciations_received_this_month: number | null
          checkins_this_year: number | null
          organization_id: string | null
          profile_id: string | null
          services_this_month: number | null
          services_this_year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      is_leader: { Args: never; Returns: boolean }
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
