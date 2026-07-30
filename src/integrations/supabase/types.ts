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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          booking_id: string
          id: string
          scanned_at: string
          scanned_by: string | null
          seminar_id: string
          student_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          scanned_at?: string
          scanned_by?: string | null
          seminar_id: string
          student_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          scanned_at?: string
          scanned_by?: string | null
          seminar_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "seminar_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_seminar_id_fkey"
            columns: ["seminar_id"]
            isOneToOne: false
            referencedRelation: "seminars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          counsellor_id: string | null
          created_at: string
          id: string
          next_action_at: string | null
          notes: string | null
          outcome: Database["public"]["Enums"]["call_outcome"]
          student_id: string
        }
        Insert: {
          counsellor_id?: string | null
          created_at?: string
          id?: string
          next_action_at?: string | null
          notes?: string | null
          outcome: Database["public"]["Enums"]["call_outcome"]
          student_id: string
        }
        Update: {
          counsellor_id?: string | null
          created_at?: string
          id?: string
          next_action_at?: string | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["call_outcome"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      counsellors: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          max_active_leads: number
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          max_active_leads?: number
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          max_active_leads?: number
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          payload: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          student_id: string | null
          subject: string
          template_key: string
          to_email: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          student_id?: string | null
          subject: string
          template_key: string
          to_email: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          student_id?: string | null
          subject?: string
          template_key?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_rooms: {
        Row: {
          capacity: number
          created_at: string
          exam_id: string
          id: string
          name: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          exam_id: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          exam_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_rooms_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_seats: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          room_id: string | null
          seat_number: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          room_id?: string | null
          seat_number?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          room_id?: string | null
          seat_number?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_seats_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_seats_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "exam_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_seats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          capacity: number
          centre: string
          created_at: string
          id: string
          scheduled_at: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          centre: string
          created_at?: string
          id?: string
          scheduled_at: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          centre?: string
          created_at?: string
          id?: string
          scheduled_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hall_tickets: {
        Row: {
          exam_id: string
          id: string
          issued_at: string
          qr_payload: string
          student_id: string
          ticket_number: string
        }
        Insert: {
          exam_id: string
          id?: string
          issued_at?: string
          qr_payload: string
          student_id: string
          ticket_number: string
        }
        Update: {
          exam_id?: string
          id?: string
          issued_at?: string
          qr_payload?: string
          student_id?: string
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "hall_tickets_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hall_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seminar_bookings: {
        Row: {
          booked_at: string
          booking_ref: string
          id: string
          qr_payload: string
          seminar_id: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Insert: {
          booked_at?: string
          booking_ref: string
          id?: string
          qr_payload: string
          seminar_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Update: {
          booked_at?: string
          booking_ref?: string
          id?: string
          qr_payload?: string
          seminar_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seminar_bookings_seminar_id_fkey"
            columns: ["seminar_id"]
            isOneToOne: false
            referencedRelation: "seminars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seminar_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      seminars: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_open: boolean
          scheduled_at: string
          seminar_type: Database["public"]["Enums"]["seminar_type"]
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_open?: boolean
          scheduled_at: string
          seminar_type: Database["public"]["Enums"]["seminar_type"]
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_open?: boolean
          scheduled_at?: string
          seminar_type?: Database["public"]["Enums"]["seminar_type"]
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      student_events: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          created_at: string
          from_stage: Database["public"]["Enums"]["admission_stage"] | null
          id: string
          reason: string | null
          student_id: string
          to_stage: Database["public"]["Enums"]["admission_stage"]
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          from_stage?: Database["public"]["Enums"]["admission_stage"] | null
          id?: string
          reason?: string | null
          student_id: string
          to_stage: Database["public"]["Enums"]["admission_stage"]
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          from_stage?: Database["public"]["Enums"]["admission_stage"] | null
          id?: string
          reason?: string | null
          student_id?: string
          to_stage?: Database["public"]["Enums"]["admission_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "student_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          counsellor_id: string | null
          course: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          lead_source: Database["public"]["Enums"]["lead_source"]
          notes: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string
          school: string | null
          stage: Database["public"]["Enums"]["admission_stage"]
          student_code: string
          updated_at: string
        }
        Insert: {
          counsellor_id?: string | null
          course?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          lead_source?: Database["public"]["Enums"]["lead_source"]
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone: string
          school?: string | null
          stage?: Database["public"]["Enums"]["admission_stage"]
          student_code: string
          updated_at?: string
        }
        Update: {
          counsellor_id?: string | null
          course?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          lead_source?: Database["public"]["Enums"]["lead_source"]
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string
          school?: string | null
          stage?: Database["public"]["Enums"]["admission_stage"]
          student_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
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
      current_counsellor_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admission_stage:
        | "NEW"
        | "ASSIGNED"
        | "CONTACTED"
        | "WOC_BOOKED"
        | "WOC_ATTENDED"
        | "ACC_BOOKED"
        | "ACC_ATTENDED"
        | "EXAM_BOOKED"
        | "HALL_TICKET_GENERATED"
      app_role:
        | "super_admin"
        | "admissions_admin"
        | "counsellor"
        | "ground_admin"
      booking_status: "BOOKED" | "ATTENDED" | "CANCELLED" | "NO_SHOW"
      call_outcome:
        | "CONNECTED"
        | "NO_ANSWER"
        | "BUSY"
        | "WRONG_NUMBER"
        | "NOT_INTERESTED"
        | "CALLBACK_REQUESTED"
      email_status: "QUEUED" | "SENT" | "FAILED" | "CANCELLED"
      lead_source:
        | "WEBSITE"
        | "REFERRAL"
        | "WALK_IN"
        | "SOCIAL_MEDIA"
        | "EDUCATION_FAIR"
        | "SCHOOL_VISIT"
        | "OTHER"
      seminar_type: "WOC" | "ACC"
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
      admission_stage: [
        "NEW",
        "ASSIGNED",
        "CONTACTED",
        "WOC_BOOKED",
        "WOC_ATTENDED",
        "ACC_BOOKED",
        "ACC_ATTENDED",
        "EXAM_BOOKED",
        "HALL_TICKET_GENERATED",
      ],
      app_role: [
        "super_admin",
        "admissions_admin",
        "counsellor",
        "ground_admin",
      ],
      booking_status: ["BOOKED", "ATTENDED", "CANCELLED", "NO_SHOW"],
      call_outcome: [
        "CONNECTED",
        "NO_ANSWER",
        "BUSY",
        "WRONG_NUMBER",
        "NOT_INTERESTED",
        "CALLBACK_REQUESTED",
      ],
      email_status: ["QUEUED", "SENT", "FAILED", "CANCELLED"],
      lead_source: [
        "WEBSITE",
        "REFERRAL",
        "WALK_IN",
        "SOCIAL_MEDIA",
        "EDUCATION_FAIR",
        "SCHOOL_VISIT",
        "OTHER",
      ],
      seminar_type: ["WOC", "ACC"],
    },
  },
} as const
