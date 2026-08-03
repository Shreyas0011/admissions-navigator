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
      academic_years: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_active: boolean
          label: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_active?: boolean
          label: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_active?: boolean
          label?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_policies: {
        Row: {
          auto_assign: boolean
          created_at: string
          default_pool_id: string | null
          enabled: boolean
          fallback_algorithm: Database["public"]["Enums"]["assignment_algorithm"]
          id: string
          name: string
          policy_type: Database["public"]["Enums"]["assignment_policy_type"]
          priority: number
          updated_at: string
        }
        Insert: {
          auto_assign?: boolean
          created_at?: string
          default_pool_id?: string | null
          enabled?: boolean
          fallback_algorithm?: Database["public"]["Enums"]["assignment_algorithm"]
          id?: string
          name: string
          policy_type?: Database["public"]["Enums"]["assignment_policy_type"]
          priority?: number
          updated_at?: string
        }
        Update: {
          auto_assign?: boolean
          created_at?: string
          default_pool_id?: string | null
          enabled?: boolean
          fallback_algorithm?: Database["public"]["Enums"]["assignment_algorithm"]
          id?: string
          name?: string
          policy_type?: Database["public"]["Enums"]["assignment_policy_type"]
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_policies_default_pool_id_fkey"
            columns: ["default_pool_id"]
            isOneToOne: false
            referencedRelation: "counsellor_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_rules: {
        Row: {
          algorithm: Database["public"]["Enums"]["assignment_algorithm"]
          created_at: string
          id: string
          policy_id: string
          pool_id: string
          priority: number
          programme_id: string | null
          updated_at: string
        }
        Insert: {
          algorithm?: Database["public"]["Enums"]["assignment_algorithm"]
          created_at?: string
          id?: string
          policy_id: string
          pool_id: string
          priority?: number
          programme_id?: string | null
          updated_at?: string
        }
        Update: {
          algorithm?: Database["public"]["Enums"]["assignment_algorithm"]
          created_at?: string
          id?: string
          policy_id?: string
          pool_id?: string
          priority?: number
          programme_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rules_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "assignment_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_rules_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "counsellor_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_rules_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          actor_id: string | null
          actor_label: string
          algorithm: Database["public"]["Enums"]["assignment_algorithm"] | null
          candidates: Json
          counsellor_id: string | null
          created_at: string
          id: string
          policy_id: string | null
          pool_id: string | null
          programme_id: string | null
          rule_id: string | null
          rule_label: string | null
          source: Database["public"]["Enums"]["assignment_source"]
          student_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string
          algorithm?: Database["public"]["Enums"]["assignment_algorithm"] | null
          candidates?: Json
          counsellor_id?: string | null
          created_at?: string
          id?: string
          policy_id?: string | null
          pool_id?: string | null
          programme_id?: string | null
          rule_id?: string | null
          rule_label?: string | null
          source?: Database["public"]["Enums"]["assignment_source"]
          student_id: string
        }
        Update: {
          actor_id?: string | null
          actor_label?: string
          algorithm?: Database["public"]["Enums"]["assignment_algorithm"] | null
          candidates?: Json
          counsellor_id?: string | null
          created_at?: string
          id?: string
          policy_id?: string | null
          pool_id?: string | null
          programme_id?: string | null
          rule_id?: string | null
          rule_label?: string | null
          source?: Database["public"]["Enums"]["assignment_source"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "assignment_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "counsellor_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "assignment_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          booking_id: string
          id: string
          programme_id: string | null
          scanned_at: string
          scanned_by: string | null
          seminar_id: string
          student_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          programme_id?: string | null
          scanned_at?: string
          scanned_by?: string | null
          seminar_id: string
          student_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          programme_id?: string | null
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
            foreignKeyName: "attendance_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
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
      counsellor_pool_members: {
        Row: {
          counsellor_id: string
          created_at: string
          id: string
          pool_id: string
        }
        Insert: {
          counsellor_id: string
          created_at?: string
          id?: string
          pool_id: string
        }
        Update: {
          counsellor_id?: string
          created_at?: string
          id?: string
          pool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counsellor_pool_members_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counsellor_pool_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "counsellor_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      counsellor_pools: {
        Row: {
          created_at: string
          default_algorithm: Database["public"]["Enums"]["assignment_algorithm"]
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_algorithm?: Database["public"]["Enums"]["assignment_algorithm"]
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_algorithm?: Database["public"]["Enums"]["assignment_algorithm"]
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      event_sessions: {
        Row: {
          capacity: number
          created_at: string
          ends_at: string
          event_id: string
          id: string
          is_open: boolean
          reserved_seats: number
          starts_at: string
          updated_at: string
          venue_id: string | null
          waitlist_enabled: boolean
          waitlist_size: number
        }
        Insert: {
          capacity?: number
          created_at?: string
          ends_at: string
          event_id: string
          id?: string
          is_open?: boolean
          reserved_seats?: number
          starts_at: string
          updated_at?: string
          venue_id?: string | null
          waitlist_enabled?: boolean
          waitlist_size?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          ends_at?: string
          event_id?: string
          id?: string
          is_open?: boolean
          reserved_seats?: number
          starts_at?: string
          updated_at?: string
          venue_id?: string | null
          waitlist_enabled?: boolean
          waitlist_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allocation_strategy: Database["public"]["Enums"]["allocation_strategy"]
          allow_cancellation: boolean
          auto_approve: boolean
          cancellation_cutoff_hours: number
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_open: boolean
          programme_id: string | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          subject: string | null
          target_stage: Database["public"]["Enums"]["admission_stage"] | null
          title: string
          updated_at: string
        }
        Insert: {
          allocation_strategy?: Database["public"]["Enums"]["allocation_strategy"]
          allow_cancellation?: boolean
          auto_approve?: boolean
          cancellation_cutoff_hours?: number
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_open?: boolean
          programme_id?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          subject?: string | null
          target_stage?: Database["public"]["Enums"]["admission_stage"] | null
          title: string
          updated_at?: string
        }
        Update: {
          allocation_strategy?: Database["public"]["Enums"]["allocation_strategy"]
          allow_cancellation?: boolean
          auto_approve?: boolean
          cancellation_cutoff_hours?: number
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_open?: boolean
          programme_id?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          subject?: string | null
          target_stage?: Database["public"]["Enums"]["admission_stage"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
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
          programme_id: string | null
          scheduled_at: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          centre: string
          created_at?: string
          id?: string
          programme_id?: string | null
          scheduled_at: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          centre?: string
          created_at?: string
          id?: string
          programme_id?: string | null
          scheduled_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
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
      programmes: {
        Row: {
          academic_year_id: string | null
          applications_close_at: string | null
          applications_open_at: string | null
          code: string
          created_at: string
          department: string
          description: string | null
          duration: string | null
          id: string
          intake: number
          name: string
          status: Database["public"]["Enums"]["programme_status"]
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          applications_close_at?: string | null
          applications_open_at?: string | null
          code: string
          created_at?: string
          department?: string
          description?: string | null
          duration?: string | null
          id?: string
          intake?: number
          name: string
          status?: Database["public"]["Enums"]["programme_status"]
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          applications_close_at?: string | null
          applications_open_at?: string | null
          code?: string
          created_at?: string
          department?: string
          description?: string | null
          duration?: string | null
          id?: string
          intake?: number
          name?: string
          status?: Database["public"]["Enums"]["programme_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      seminar_bookings: {
        Row: {
          booked_at: string
          booking_ref: string
          id: string
          qr_payload: string
          seminar_id: string
          session_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Insert: {
          booked_at?: string
          booking_ref: string
          id?: string
          qr_payload: string
          seminar_id: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
        }
        Update: {
          booked_at?: string
          booking_ref?: string
          id?: string
          qr_payload?: string
          seminar_id?: string
          session_id?: string | null
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
            foreignKeyName: "seminar_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
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
          programme_id: string | null
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
          programme_id?: string | null
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
          programme_id?: string | null
          scheduled_at?: string
          seminar_type?: Database["public"]["Enums"]["seminar_type"]
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "seminars_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
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
          programme_id: string | null
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
          programme_id?: string | null
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
          programme_id?: string | null
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
          {
            foreignKeyName: "students_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
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
      venues: {
        Row: {
          building: string | null
          campus: string
          capacity: number
          created_at: string
          facilities: string[]
          floor: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          building?: string | null
          campus?: string
          capacity?: number
          created_at?: string
          facilities?: string[]
          floor?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          building?: string | null
          campus?: string
          capacity?: number
          created_at?: string
          facilities?: string[]
          floor?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
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
      allocation_strategy:
        | "FIRST_AVAILABLE"
        | "LEAST_FILLED"
        | "ROUND_ROBIN"
        | "MANUAL"
      app_role:
        | "super_admin"
        | "admissions_admin"
        | "counsellor"
        | "ground_admin"
      assignment_algorithm:
        | "ROUND_ROBIN"
        | "LEAST_WORKLOAD"
        | "LEAST_ACTIVE"
        | "MANUAL"
      assignment_policy_type:
        | "MANUAL"
        | "ROUND_ROBIN"
        | "LEAST_WORKLOAD"
        | "LEAST_ACTIVE"
        | "PROGRAMME_BASED"
        | "HYBRID"
      assignment_source: "AUTO" | "MANUAL"
      booking_status: "BOOKED" | "ATTENDED" | "CANCELLED" | "NO_SHOW"
      call_outcome:
        | "CONNECTED"
        | "NO_ANSWER"
        | "BUSY"
        | "WRONG_NUMBER"
        | "NOT_INTERESTED"
        | "CALLBACK_REQUESTED"
      email_status: "QUEUED" | "SENT" | "FAILED" | "CANCELLED"
      event_type: "WOC" | "ACC" | "EXAM" | "OTHER"
      lead_source:
        | "WEBSITE"
        | "REFERRAL"
        | "WALK_IN"
        | "SOCIAL_MEDIA"
        | "EDUCATION_FAIR"
        | "SCHOOL_VISIT"
        | "OTHER"
      programme_status: "DRAFT" | "OPEN" | "CLOSED"
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
      allocation_strategy: [
        "FIRST_AVAILABLE",
        "LEAST_FILLED",
        "ROUND_ROBIN",
        "MANUAL",
      ],
      app_role: [
        "super_admin",
        "admissions_admin",
        "counsellor",
        "ground_admin",
      ],
      assignment_algorithm: [
        "ROUND_ROBIN",
        "LEAST_WORKLOAD",
        "LEAST_ACTIVE",
        "MANUAL",
      ],
      assignment_policy_type: [
        "MANUAL",
        "ROUND_ROBIN",
        "LEAST_WORKLOAD",
        "LEAST_ACTIVE",
        "PROGRAMME_BASED",
        "HYBRID",
      ],
      assignment_source: ["AUTO", "MANUAL"],
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
      event_type: ["WOC", "ACC", "EXAM", "OTHER"],
      lead_source: [
        "WEBSITE",
        "REFERRAL",
        "WALK_IN",
        "SOCIAL_MEDIA",
        "EDUCATION_FAIR",
        "SCHOOL_VISIT",
        "OTHER",
      ],
      programme_status: ["DRAFT", "OPEN", "CLOSED"],
      seminar_type: ["WOC", "ACC"],
    },
  },
} as const
