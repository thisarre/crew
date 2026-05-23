/*
 * Types générés manuellement à partir du schéma SQL (Feature 1.2).
 * Re-run `npx supabase gen types typescript --project-ref <id>` lorsque la base distante est prête.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_color: string | null;
          avatar_url: string | null;
          birthday: string | null;
          device_id: string | null;
          device_locked_until: string | null;
          display_name: string;
          id: string;
          initials: string;
          is_active: boolean | null;
          joined_at: string | null;
          organization_id: string | null;
          phone: string | null;
          role: 'member' | 'admin';
          why_i_serve: string | null;
        };
        Insert: {
          avatar_color?: string | null;
          avatar_url?: string | null;
          birthday?: string | null;
          device_id?: string | null;
          device_locked_until?: string | null;
          display_name: string;
          id?: string;
          initials: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          role?: 'member' | 'admin';
          why_i_serve?: string | null;
        };
        Update: {
          avatar_color?: string | null;
          avatar_url?: string | null;
          birthday?: string | null;
          device_id?: string | null;
          device_locked_until?: string | null;
          display_name?: string;
          id?: string;
          initials?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          organization_id?: string | null;
          phone?: string | null;
          role?: 'member' | 'admin';
          why_i_serve?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      skills: {
        Row: {
          color: string | null;
          display_order: number | null;
          icon_name: string | null;
          id: string;
          name: string;
          organization_id: string | null;
        };
        Insert: {
          color?: string | null;
          display_order?: number | null;
          icon_name?: string | null;
          id?: string;
          name: string;
          organization_id?: string | null;
        };
        Update: {
          color?: string | null;
          display_order?: number | null;
          icon_name?: string | null;
          id?: string;
          name?: string;
          organization_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'skills_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      member_skills: {
        Row: {
          id: string;
          level: 'learning' | 'autonomous' | 'trainer';
          profile_id: string | null;
          skill_id: string | null;
          trained_at: string | null;
          trained_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          level: 'learning' | 'autonomous' | 'trainer';
          profile_id?: string | null;
          skill_id?: string | null;
          trained_at?: string | null;
          trained_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          level?: 'learning' | 'autonomous' | 'trainer';
          profile_id?: string | null;
          skill_id?: string | null;
          trained_at?: string | null;
          trained_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'member_skills_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_skills_skill_id_fkey';
            columns: ['skill_id'];
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_skills_trained_by_fkey';
            columns: ['trained_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      services: {
        Row: {
          arrival_time: string | null;
          created_at: string | null;
          event_type: 'sunday_service' | 'midweek_service' | 'team_call' | 'special_event';
          id: string;
          location: string | null;
          notes: string | null;
          organization_id: string | null;
          published_at: string | null;
          service_date: string;
          series_id: string | null;
          spiritual_theme: string | null;
          spiritual_verse_ref: string | null;
          spiritual_verse_text: string | null;
          start_time: string;
          status: 'draft' | 'published' | 'completed' | 'cancelled';
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          arrival_time?: string | null;
          created_at?: string | null;
          event_type: 'sunday_service' | 'midweek_service' | 'team_call' | 'special_event';
          id?: string;
          location?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          published_at?: string | null;
          service_date: string;
          series_id?: string | null;
          spiritual_theme?: string | null;
          spiritual_verse_ref?: string | null;
          spiritual_verse_text?: string | null;
          start_time: string;
          status?: 'draft' | 'published' | 'completed' | 'cancelled';
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          arrival_time?: string | null;
          created_at?: string | null;
          event_type?: 'sunday_service' | 'midweek_service' | 'team_call' | 'special_event';
          id?: string;
          location?: string | null;
          notes?: string | null;
          organization_id?: string | null;
          published_at?: string | null;
          service_date?: string;
          series_id?: string | null;
          spiritual_theme?: string | null;
          spiritual_verse_ref?: string | null;
          spiritual_verse_text?: string | null;
          start_time?: string;
          status?: 'draft' | 'published' | 'completed' | 'cancelled';
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'services_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      service_slots: {
        Row: {
          id: string;
          notes: string | null;
          positions_required: number | null;
          service_id: string | null;
          skill_id: string | null;
        };
        Insert: {
          id?: string;
          notes?: string | null;
          positions_required?: number | null;
          service_id?: string | null;
          skill_id?: string | null;
        };
        Update: {
          id?: string;
          notes?: string | null;
          positions_required?: number | null;
          service_id?: string | null;
          skill_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_slots_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_slots_skill_id_fkey';
            columns: ['skill_id'];
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          }
        ];
      };
      assignments: {
        Row: {
          cancelled_at: string | null;
          cancelled_reason: string | null;
          created_at: string | null;
          id: string;
          is_paired_with: string | null;
          is_trainee: boolean | null;
          profile_id: string | null;
          service_id: string | null;
          slot_id: string | null;
          status: 'present' | 'cancelled' | 'pending_validation';
        };
        Insert: {
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          created_at?: string | null;
          id?: string;
          is_paired_with?: string | null;
          is_trainee?: boolean | null;
          profile_id?: string | null;
          service_id?: string | null;
          slot_id?: string | null;
          status?: 'present' | 'cancelled' | 'pending_validation';
        };
        Update: {
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          created_at?: string | null;
          id?: string;
          is_paired_with?: string | null;
          is_trainee?: boolean | null;
          profile_id?: string | null;
          service_id?: string | null;
          slot_id?: string | null;
          status?: 'present' | 'cancelled' | 'pending_validation';
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_slot_id_fkey';
            columns: ['slot_id'];
            referencedRelation: 'service_slots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_is_paired_with_fkey';
            columns: ['is_paired_with'];
            referencedRelation: 'assignments';
            referencedColumns: ['id'];
          }
        ];
      };
      availabilities: {
        Row: {
          created_at: string | null;
          id: string;
          profile_id: string | null;
          reason: string | null;
          unavailable_from: string;
          unavailable_to: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          profile_id?: string | null;
          reason?: string | null;
          unavailable_from: string;
          unavailable_to: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          profile_id?: string | null;
          reason?: string | null;
          unavailable_from?: string;
          unavailable_to?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'availabilities_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      monthly_validations: {
        Row: {
          created_at: string | null;
          id: string;
          month: number;
          organization_id: string | null;
          profile_id: string | null;
          validated_at: string | null;
          year: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          month: number;
          organization_id?: string | null;
          profile_id?: string | null;
          validated_at?: string | null;
          year: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          month?: number;
          organization_id?: string | null;
          profile_id?: string | null;
          validated_at?: string | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_validations_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_validations_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      appreciations: {
        Row: {
          content: string;
          created_at: string | null;
          from_profile_id: string | null;
          id: string;
          service_id: string | null;
          to_profile_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          from_profile_id?: string | null;
          id?: string;
          service_id?: string | null;
          to_profile_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          from_profile_id?: string | null;
          id?: string;
          service_id?: string | null;
          to_profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appreciations_from_profile_id_fkey';
            columns: ['from_profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appreciations_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appreciations_to_profile_id_fkey';
            columns: ['to_profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      spiritual_content: {
        Row: {
          content_type: 'weekly_thought' | 'service_theme';
          created_at: string | null;
          id: string;
          organization_id: string | null;
          published_at: string | null;
          scheduled_for: string | null;
          service_id: string | null;
          status: 'draft' | 'scheduled' | 'published';
          title: string | null;
          verse_reference: string | null;
          verse_text: string;
        };
        Insert: {
          content_type?: 'weekly_thought' | 'service_theme';
          created_at?: string | null;
          id?: string;
          organization_id?: string | null;
          published_at?: string | null;
          scheduled_for?: string | null;
          service_id?: string | null;
          status?: 'draft' | 'scheduled' | 'published';
          title?: string | null;
          verse_reference?: string | null;
          verse_text: string;
        };
        Update: {
          content_type?: 'weekly_thought' | 'service_theme';
          created_at?: string | null;
          id?: string;
          organization_id?: string | null;
          published_at?: string | null;
          scheduled_for?: string | null;
          service_id?: string | null;
          status?: 'draft' | 'scheduled' | 'published';
          title?: string | null;
          verse_reference?: string | null;
          verse_text?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'spiritual_content_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'spiritual_content_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          }
        ];
      };
      push_subscriptions: {
        Row: {
          auth_key: string;
          created_at: string | null;
          device_user_agent: string | null;
          endpoint: string;
          id: string;
          p256dh_key: string;
          profile_id: string | null;
        };
        Insert: {
          auth_key: string;
          created_at?: string | null;
          device_user_agent?: string | null;
          endpoint: string;
          id?: string;
          p256dh_key: string;
          profile_id?: string | null;
        };
        Update: {
          auth_key?: string;
          created_at?: string | null;
          device_user_agent?: string | null;
          endpoint?: string;
          id?: string;
          p256dh_key?: string;
          profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      bible_verses: {
        Row: {
          book: string;
          chapter: number;
          id: string;
          reference: string;
          text: string;
          verse: number;
        };
        Insert: {
          book: string;
          chapter: number;
          id?: string;
          reference: string;
          text: string;
          verse: number;
        };
        Update: {
          book?: string;
          chapter?: number;
          id?: string;
          reference?: string;
          text?: string;
          verse?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
