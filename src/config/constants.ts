import {
  LayoutGrid,
  BookOpen,
  PhoneCall,
  Headset,
  Users,
  UserPlus,
  CalendarDays,
  FileText,
  Mail,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { AdmissionStage, AppRole, LeadSource } from "@/domains/admissions/types";

export const APP_NAME = "Admissions OS";
export const APP_TAGLINE = "Admin Portal";

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export type NavItem = {
  title: string;
  url:
    | "/dashboard"
    | "/programmes"
    | "/students"
    | "/my-leads"
    | "/counsellors"
    | "/lead-assignment"
    | "/seminars"
    | "/exams"
    | "/emails"
    | "/reports"
    | "/settings";
  icon: LucideIcon;
  roles: AppRole[];
};

const ALL_STAFF: AppRole[] = ["super_admin", "admissions_admin", "counsellor", "ground_admin"];
const ADMINS: AppRole[] = ["super_admin", "admissions_admin"];

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, roles: ALL_STAFF },
  { title: "Programmes", url: "/programmes", icon: BookOpen, roles: ADMINS },
  { title: "Students", url: "/students", icon: Users, roles: ALL_STAFF },
  { title: "My Leads", url: "/my-leads", icon: PhoneCall, roles: ["counsellor"] },
  { title: "Counsellors", url: "/counsellors", icon: Headset, roles: ADMINS },
  { title: "Lead Assignment", url: "/lead-assignment", icon: UserPlus, roles: ADMINS },
  { title: "Seminars", url: "/seminars", icon: CalendarDays, roles: ADMINS },
  { title: "Exams", url: "/exams", icon: FileText, roles: ADMINS },
  { title: "Emails", url: "/emails", icon: Mail, roles: ADMINS },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ADMINS },
  { title: "Settings", url: "/settings", icon: Settings, roles: ALL_STAFF },
];

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admissions_admin: "Admissions Admin",
  counsellor: "Counsellor",
  ground_admin: "Ground Admin",
};

/* ------------------------------------------------------------------ */
/* Admission stages — the Phase 1 state machine                        */
/* ------------------------------------------------------------------ */

export type StageTone = "neutral" | "info" | "primary" | "success" | "warning";

export type StageMeta = {
  value: AdmissionStage;
  label: string;
  short: string;
  tone: StageTone;
};

export const STAGES: StageMeta[] = [
  { value: "NEW", label: "New Lead", short: "New", tone: "neutral" },
  { value: "ASSIGNED", label: "Assigned", short: "Assigned", tone: "info" },
  { value: "CONTACTED", label: "Contacted", short: "Contacted", tone: "success" },
  { value: "WOC_BOOKED", label: "WOC Booked", short: "WOC Booked", tone: "primary" },
  { value: "WOC_ATTENDED", label: "WOC Attended", short: "WOC Done", tone: "success" },
  { value: "ACC_BOOKED", label: "ACC Pending", short: "ACC Pending", tone: "warning" },
  { value: "ACC_ATTENDED", label: "ACC Attended", short: "ACC Done", tone: "success" },
  { value: "EXAM_BOOKED", label: "Exam Pending", short: "Exam Pending", tone: "info" },
  {
    value: "HALL_TICKET_GENERATED",
    label: "Hall Ticket Generated",
    short: "Hall Ticket",
    tone: "primary",
  },
];

export const STAGE_MAP: Record<AdmissionStage, StageMeta> = Object.fromEntries(
  STAGES.map((s) => [s.value, s]),
) as Record<AdmissionStage, StageMeta>;

/* ------------------------------------------------------------------ */
/* Lead sources                                                        */
/* ------------------------------------------------------------------ */

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "EDUCATION_FAIR", label: "Education Fair" },
  { value: "SCHOOL_VISIT", label: "School Visit" },
  { value: "OTHER", label: "Other" },
];

export const COURSE_OPTIONS = [
  "B.Tech CSE",
  "B.Tech IT",
  "B.Tech ECE",
  "B.Tech Mech",
  "B.Tech Civil",
  "BCA",
  "BBA",
  "B.Com Hons",
  "B.Sc Physics",
  "B.Sc Chemistry",
  "B.Sc Maths",
  "B.Des",
  "BA Economics",
  "MBA Finance",
];

export const PAGE_SIZE = 10;
